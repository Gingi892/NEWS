
import React, { useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { InvokeLLM } from '@/api/integrations';
import { Report } from '@/api/entities';
import { Weapon } from '@/api/entities';

const LiveReportEngine = forwardRef(({ onNewReport, onStatusChange, scanInterval, latestReport }, ref) => {
  const isScanningRef = useRef(false);
  const timerIdRef = useRef(null);
  const retryCountRef = useRef(0);
  const scanCountRef = useRef(0);
  const lastScanTimeRef = useRef(null);
  const isInitialMount = useRef(true);

  const getRealWorldTime = useCallback(async () => {
    try {
      const timeResponse = await InvokeLLM({
        prompt: `What is the current date and time right now? Provide it in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) in UTC timezone. Return only the timestamp, nothing else.`,
        add_context_from_internet: true
      });
      
      const timestamp = timeResponse.trim();
      const realTime = new Date(timestamp);
      
      if (isNaN(realTime.getTime())) {
        throw new Error('Invalid timestamp received');
      }
      
      console.log(`🌍 זמן עולמי אמיתי התקבל: ${realTime.toISOString()}`);
      return realTime;
    } catch (error) {
      console.log('⚠️ שגיאה בקבלת זמן עולמי, חוזר לזמן מקומי:', error);
      return new Date();
    }
  }, []);

  const generateAndPublishReport = useCallback(async (isRetry = false) => {
    if (isScanningRef.current && !isRetry) return;

    scanCountRef.current += 1;
    console.log(`🔍 בדיקה מספר ${scanCountRef.current} - התחלת סריקה חדשה`);
    
    isScanningRef.current = true;
    onStatusChange({ state: 'scanning', message: 'מחפש עדכונים אחרונים...' });

    try {
      const currentTime = await getRealWorldTime();
      
      const timeWindowEnd = currentTime;
      const isFirstScan = !lastScanTimeRef.current;
      const effectiveInterval = isFirstScan ? 60 : scanInterval;
      const actualWindowStart = new Date(currentTime.getTime() - (effectiveInterval * 60 * 1000));
      
      console.log(`⏰ חלון זמן לניתוח: ${actualWindowStart.toISOString()} עד ${timeWindowEnd.toISOString()}`);
      console.log(`📊 מרווח: ${effectiveInterval} דקות ${isFirstScan ? '(סריקה ראשונה)' : ''}`);
      
      lastScanTimeRef.current = currentTime;
      const uniqueUrl = `https://rss.app/feeds/_tasfa3b5SrEoAe6T.csv?t=${Date.now()}`;

      onStatusChange({ state: 'scanning', message: 'מוריד נתונים עדכניים מהפיד...' });
      
      const [csvData, weaponsCatalog] = await Promise.all([
        Promise.race([
            InvokeLLM({
              prompt: `Please download and return the complete, raw CSV content from this URL: ${uniqueUrl}

CRITICAL REQUIREMENTS:
1. This MUST be a fresh download - do not use any cached version.
2. Return the complete CSV text exactly as it appears.
3. Include ALL columns and rows without any modification.
4. Do not summarize, filter, or change anything.

If you cannot access fresh data, explicitly state "Cannot access fresh data".`,
              add_context_from_internet: true
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout loading CSV')), 90000)
            )
        ]),
        Weapon.list()
      ]);
      
      console.log(`🔫 קטלוג אמל"ח נטען: ${weaponsCatalog.length} פריטים`);

      if (!csvData || typeof csvData !== 'string' || csvData.length < 50) {
        throw new Error('נתוני CSV לא תקינים או ריקים');
      }

      console.log(`✅ CSV טרי הורד בהצלחה (${csvData.length} תווים)`);
      onStatusChange({ state: 'scanning', message: 'מנתח מידע חדש בחלון זמן מדויק...' });

      const previousKeyItems = latestReport?.key_items || [];
      const weaponsCatalogForPrompt = weaponsCatalog.map(w => ({id: w.id, name: w.name}));

      const analysisResult = await Promise.race([
        InvokeLLM({
          prompt: `
תפקידך: לסכם בעברית עניינית את ההתפתחויות בין ישראל לאיראן בטווח הזמן המדויק שסיפקתי.

## קלט (נתוני גלם)
**קלט (JSON):**
{
  "time_window_start": "${actualWindowStart.toISOString()}",
  "time_window_end":   "${timeWindowEnd.toISOString()}",
  "events": ${JSON.stringify(csvData)},
  "previous_key_items": ${JSON.stringify(previousKeyItems)},
  "weapons_catalog": ${JSON.stringify(weaponsCatalogForPrompt)}
}

## חוקי ברזל:
1. עבוד רק על events בתוך חלון הזמן שסופק.
2. אם שדה "confidence" קיים באירוע, כלול רק אירועים עם ערך גדול או שווה ל-0.7.
3. אל תחזור על previous_key_items. המטרה היא לדווח רק על מה שחדש.
4. אין ליצור קשרים סיבתיים שלא מופיעים מפורשות בנתונים.
5. אם אין אירועים חדשים העומדים בתנאים, יש למלא את השדות 'israel_actions', 'enemy_actions', 'general_updates' במחרוזת המדויקת: "אין עדכונים בטווח המבוקש."
6. bulletin_text חייב להיות עד 350 תווים, ללא סימני קריאה (!).

## זיהוי מיקומים ואמל"ח (חובה!):
- **מיקומים**: סרוק את הטקסט וזהה כל שם מקום (עיר, אזור, מתקן) שמוזכר. הוסף אותו ל-mentioned_locations עם קואורדינטות מדויקות.
- **אמל"ח**: זהה כל שם נשק או אמצעי לחימה שמוזכר וצלב אותו עם weapons_catalog.
- דוגמאות למיקומים: טהרן, שאהרוד, אספהאן, בגדד, ביירות, דמשק, רפיח, חיפה וכו'.
- דוגמאות לאמל"ח: שאהד-136, פאתח-110, קאסם, טיל בליסטי וכו'.

## מבנה פלט JSON מחייב:
- mentioned_locations: רק מיקומים שהוזכרו בפירוש בטקסט, עם קואורדינטות מדויקות
- mentioned_weapons: רק אמל"ח שהוזכר בפירוש בטקסט, עם weapon_id מהקטלוג
- אם אין מיקומים או אמל"ח - החזר מערך ריק []

דוגמה לפורמט נכון:
{
  "mentioned_locations": [
    {"name": "שאהרוד", "lat": 36.4180, "lng": 54.9763, "category": "israel_actions"},
    {"name": "טהרן", "lat": 35.6892, "lng": 51.3890, "category": "enemy_actions"}
  ],
  "mentioned_weapons": [
    {"name": "שאהד-136", "weapon_id": "abc123", "category": "enemy_actions"}
  ]
}

**חשוב מאוד**: אם הטקסט מזכיר מקום כלשהו (כמו "תקיפה דווחה בשאהרוד"), חובה להוסיף אותו ל-mentioned_locations!
`,
          response_json_schema: {
            "type": "object",
            "properties": {
              "bulletin_text": { "type": "string" },
              "key_items": { "type": "array", "items": { "type": "string" } },
              "israel_actions": { "type": "string" },
              "enemy_actions": { "type": "string" },
              "general_updates": { "type": "string" },
              "hfc_guidelines": { "type": "string" },
              "status": { "type": "string", "enum": ["green", "yellow", "red"] },
              "mentioned_locations": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "lat": { "type": "number" },
                    "lng": { "type": "number" },
                    "category": { "type": "string", "enum": ["israel_actions", "enemy_actions", "general_updates", "hfc_guidelines"] }
                  },
                  "required": ["name", "lat", "lng", "category"]
                }
              },
              "mentioned_weapons": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "weapon_id": { "type": "string" },
                    "category": { "type": "string", "enum": ["israel_actions", "enemy_actions", "general_updates"] }
                  },
                  "required": ["name", "weapon_id", "category"]
                }
              },
              "is_verified": { "type": "boolean" },
              "confidence_level": { "type": "number" },
              "tags": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["bulletin_text", "key_items", "israel_actions", "enemy_actions", "general_updates", "hfc_guidelines", "status"]
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout analyzing data')), 60000)
        )
      ]);

      retryCountRef.current = 0;

      console.log(`תוצאות ניתוח:`, analysisResult);

      // וידוא שהתוצאה תקינה
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error("תשובה לא תקינה מהבינה המלאכותית");
      }

      // וידוא שכל השדות הנדרשים קיימים
      const requiredFields = ['bulletin_text', 'key_items', 'israel_actions', 'enemy_actions', 'hfc_guidelines', 'general_updates', 'status'];
      for (const field of requiredFields) {
        if (!analysisResult[field]) {
          if (field === 'key_items') {
            analysisResult[field] = [];
          } else if (['israel_actions', 'enemy_actions', 'general_updates'].includes(field)) {
            analysisResult[field] = "אין עדכונים בטווח המבוקש.";
          } else {
            analysisResult[field] = "";
          }
        }
      }

      // וידוא פורמט תקין למערכי מיקומים ואמל"ח
      if (!Array.isArray(analysisResult.mentioned_locations)) {
        analysisResult.mentioned_locations = [];
      }
      if (!Array.isArray(analysisResult.mentioned_weapons)) {
        analysisResult.mentioned_weapons = [];
      }

      // הגדרת ברירות מחדל לשדות אופציונליים
      if (!analysisResult.tags) analysisResult.tags = [];
      if (typeof analysisResult.is_verified !== 'boolean') analysisResult.is_verified = false;
      if (typeof analysisResult.confidence_level !== 'number') analysisResult.confidence_level = 5;

      const noRelevantDataString = "אין עדכונים בטווח המבוקש.";
      const hasUpdates = !(
        (analysisResult.israel_actions || "").includes(noRelevantDataString) &&
        (analysisResult.enemy_actions || "").includes(noRelevantDataString) &&
        (analysisResult.general_updates || "").includes(noRelevantDataString)
      );

      console.log(`📊 האם יש עדכונים: ${hasUpdates}`);
      
      const publishingMessage = hasUpdates ? 'מפרסם דיווח חדש...' : 'מאשר שאין שינויים...';
      onStatusChange({ state: 'publishing', message: publishingMessage });
      
      // יצירת אובייקט דיווח נקי
      const reportData = {
        bulletin_text: analysisResult.bulletin_text, // Corrected from bulletin_items
        key_items: analysisResult.key_items,
        israel_actions: analysisResult.israel_actions,
        enemy_actions: analysisResult.enemy_actions,
        hfc_guidelines: analysisResult.hfc_guidelines,
        general_updates: analysisResult.general_updates,
        status: analysisResult.status,
        is_verified: analysisResult.is_verified,
        confidence_level: analysisResult.confidence_level,
        tags: [...(analysisResult.tags), `${scanInterval}min`, `scan_${scanCountRef.current}`],
        mentioned_locations: analysisResult.mentioned_locations,
        mentioned_weapons: analysisResult.mentioned_weapons
      };
      
      const newReport = await Report.create(reportData);
      
      onNewReport(newReport);
      
      if (hasUpdates) {
        onStatusChange({ state: 'idle', message: `עדכון הבא בעוד ${scanInterval} דקות` });
        console.log(`✅ דיווח חדש פורסם בהצלחה`);
      } else {
        onStatusChange({ state: 'idle', message: 'ללא התפתחויות חדשות' });
        console.log(`✅ אין התפתחויות חדשות. ממשיך להאזין.`);
      }

    } catch (error) {
      console.error(`❌ שגיאה בבדיקה #${scanCountRef.current}:`, error.message);
      
      retryCountRef.current += 1;
      const isNetworkError = error.message.includes('Network Error');
      
      if (retryCountRef.current <= 3) {
        const userMessage = isNetworkError 
          ? `⚠️ בעיית רשת. מנסה שוב (ניסיון ${retryCountRef.current}/3)...`
          : `⚠️ בעיה טכנית זמנית. מנסה שוב (ניסיון ${retryCountRef.current}/3)...`;

        onStatusChange({ state: 'error', message: userMessage });
        
        const retryDelay = retryCountRef.current * 15000;
        setTimeout(() => {
          generateAndPublishReport(true);
        }, retryDelay);
      } else {
        const userMessage = isNetworkError
          ? `⚠️ בעיית רשת מתמשכת. המערכת תנסה שוב באופן אוטומטי.`
          : `⚠️ לא ניתן לגשת לפיד הנתונים. עדכון הבא בעוד ${scanInterval} דקות.`;
        onStatusChange({ state: 'error', message: userMessage });
        retryCountRef.current = 0;
      }
    } finally {
      isScanningRef.current = false;
    }
  }, [scanInterval, onNewReport, onStatusChange, getRealWorldTime, latestReport]);

  useEffect(() => {
    console.log(`🔄 מעדכן מחזור סריקה ל-${scanInterval} דקות`);

    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      retryCountRef.current = 0;
      scanCountRef.current = 0;
      lastScanTimeRef.current = null;
      generateAndPublishReport(false);
    }
    
    const intervalMs = scanInterval * 60 * 1000;
    timerIdRef.current = setInterval(() => {
      if (retryCountRef.current === 0) {
        generateAndPublishReport(false);
      }
    }, intervalMs);

    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, [scanInterval, generateAndPublishReport]);

  useImperativeHandle(ref, () => ({
    forceScan() {
      if (!isScanningRef.current) {
        console.log('🔄 רענון ידני - מתחיל ניתוח חלון זמן חדש');
        retryCountRef.current = 0;
        generateAndPublishReport(false);
      }
    }
  }));

  return null;
});

LiveReportEngine.displayName = 'LiveReportEngine';

export default LiveReportEngine;
