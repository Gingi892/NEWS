import React, { useEffect, useRef } from 'react';

const NotificationManager = ({ onNewReport, latestReport }) => {
  const lastReportIdRef = useRef(null);
  const notificationPermissionRef = useRef(null);

  // בקש הרשאת התראות
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        notificationPermissionRef.current = permission;
        console.log('הרשאת התראות:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('שגיאה בבקשת הרשאת התראות:', error);
        return false;
      }
    }
    return false;
  };

  // בדוק הרשאות התראות בטעינה
  useEffect(() => {
    if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
      
      // אם עדיין לא נתנו הרשאה, בקש אותה
      if (Notification.permission === 'default') {
        // חכה קצת לפני בקשת ההרשאה כדי לא להפריע לטעינה
        setTimeout(() => {
          requestNotificationPermission();
        }, 3000);
      }
    }
  }, []);

  // שלח התראה על דיווח חדש
  const sendNotification = (report) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // קבע את סוג ההתראה לפי הסטטוס
    let title = '';
    let icon = '';
    let urgency = 'normal';
    
    switch (report.status) {
      case 'red':
        title = '🚨 דיווח ביטחוני חמור';
        urgency = 'high';
        break;
      case 'yellow':
        title = '⚠️ דיווח ביטחוני מתוח';
        urgency = 'normal';
        break;
      case 'green':
      default:
        title = '🟢 עדכון ביטחוני';
        urgency = 'low';
        break;
    }

    // הכן את תוכן ההתראה
    let body = '';
    const updates = [];
    
    if (report.israel_actions && report.israel_actions !== 'ללא עדכון' && report.israel_actions !== 'ללא עדכונים חדשים') {
      updates.push(`🇮🇱 ${report.israel_actions.substring(0, 50)}${report.israel_actions.length > 50 ? '...' : ''}`);
    }
    
    if (report.enemy_actions && report.enemy_actions !== 'ללא עדכון' && report.enemy_actions !== 'ללא עדכונים חדשים') {
      updates.push(`🎯 ${report.enemy_actions.substring(0, 50)}${report.enemy_actions.length > 50 ? '...' : ''}`);
    }
    
    if (report.hfc_guidelines && report.hfc_guidelines !== 'ללא עדכון' && !report.hfc_guidelines.includes('אין הודעות')) {
      updates.push(`📢 ${report.hfc_guidelines.substring(0, 50)}${report.hfc_guidelines.length > 50 ? '...' : ''}`);
    }

    if (updates.length > 0) {
      body = updates.join('\n');
    } else {
      body = 'עדכון ביטחוני חדש זמין';
    }

    // צור את ההתראה
    try {
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico', // ניתן להחליף בלוגו מתאים
        badge: '/favicon.ico',
        tag: 'security-report', // מונע התראות כפולות
        requireInteraction: urgency === 'high', // התראות חמורות יישארו עד שיקליקו עליהן
        silent: false,
        timestamp: Date.now(),
        data: {
          reportId: report.id,
          status: report.status,
          url: window.location.href
        }
      });

      // כשיקליקו על ההתראה, תעביר אותם לאפליקציה
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus(); // תביא את החלון לחזית
        notification.close();
      };

      // סגור את ההתראה אוטומטית אחרי זמן (אלא אם זה דיווח חמור)
      if (urgency !== 'high') {
        setTimeout(() => {
          notification.close();
        }, 8000); // 8 שניות
      }

      console.log('✅ התראה נשלחה:', title);
    } catch (error) {
      console.error('שגיאה בשליחת התראה:', error);
    }
  };

  // עקוב אחר דיווחים חדשים
  useEffect(() => {
    if (latestReport && latestReport.id !== lastReportIdRef.current) {
      // זה דיווח חדש
      if (lastReportIdRef.current !== null) { // לא הדיווח הראשון בטעינה
        sendNotification(latestReport);
      }
      lastReportIdRef.current = latestReport.id;
    }
  }, [latestReport]);

  return null; // קומפוננט שקוף שלא מציג כלום
};

export default NotificationManager;