
import React from 'react';
import { Clock, ShieldCheck, MapPin, Target, Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import StatusIndicator from './StatusIndicator';

export default function ReportCard({ report, isLatest = false, scanInterval }) {
  const timeString = format(new Date(report.created_date), 'HH:mm', { locale: he });
  const dateString = format(new Date(report.created_date), 'dd/MM/yyyy', { locale: he });

  /**
   * Generates a Hebrew description for a given number of minutes,
   * handling singular/plural and hours.
   * @param {number} minutes - The number of minutes.
   * @returns {string} The formatted time description in Hebrew.
   */
  const getIntervalDescription = (minutes) => {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
      return ''; // Return an empty string or suitable default if minutes is invalid/zero
    }
    if (minutes === 1) return 'דקה';
    if (minutes < 60) return `${minutes} דקות`;

    const hours = minutes / 60;
    if (hours === 1) return 'שעה';
    if (Number.isInteger(hours)) return `${hours} שעות`;

    // Fallback for non-integer hours (e.g., 90 minutes) or other cases
    return `${minutes} דקות`;
  };

  /**
   * Constructs a dynamic title including the scan interval if available.
   * @param {string} baseText - The core text of the title.
   * @param {number} intervalValue - The scan interval in minutes.
   * @returns {string} The full dynamic title.
   */
  const dynamicTitle = (baseText, intervalValue) => {
    if (typeof intervalValue !== 'number' || isNaN(intervalValue) || intervalValue <= 0) {
      // If scanInterval is not a valid positive number, return only the base text.
      // This preserves the functionality of showing a concise title when no interval is set.
      return baseText;
    }
    const intervalDescription = getIntervalDescription(intervalValue);
    return `${baseText} ב${intervalDescription} האחרונות`;
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 mx-1 sm:mx-0">
      
      {/* כותרת הדיווח */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl border ${
        isLatest ? 'border-blue-300 shadow-lg' : 'border-slate-200 shadow-sm'
      } p-3 sm:p-4 md:p-6 transition-all duration-300 hover:shadow-md`}>
        
        <div className="flex items-start justify-between mb-3 sm:mb-4 md:mb-6 gap-3">
          <StatusIndicator status={report.status} size={isLatest ? 'large' : 'normal'} />
          <div className="text-right flex-shrink-0">
            <div className="flex items-center justify-end gap-1 text-slate-500 text-xs sm:text-sm mb-0.5 sm:mb-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="tabular-nums">{timeString}</span>
            </div>
            <div className="text-xs text-slate-400 tabular-nums">{dateString}</div>
          </div>
        </div>

        {/* פרטים גיאוגרפיים */}
        {report.geographic_details && report.geographic_details.length > 2 && (
          <div className="flex items-start gap-1 min-w-0 mb-4">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700 text-sm font-medium break-words leading-tight">{report.geographic_details}</p>
          </div>
        )}

        {/* חותמת אימות */}
        {report.is_verified && (
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-emerald-600 min-w-0">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">דיווח מאומת</span>
          </div>
        )}
      </div>

      {/* שלושה כרטיסים נפרדים */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        
        {/* פעולות ישראל */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-blue-800 text-sm sm:text-base md:text-lg">
                {dynamicTitle('פעולות ישראל', scanInterval)}
              </h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed break-words">
                {report.israel_actions || "שקט יחסי"}
              </p>
            </div>
          </div>
        </div>

        {/* פעולות אויב */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-red-800 text-sm sm:text-base md:text-lg">
                {dynamicTitle('פעולות האויב', scanInterval)}
              </h3>
            </div>
            <div className="bg-red-50 rounded-lg p-3 sm:p-4">
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed break-words">
                {report.enemy_actions || "שקט יחסי"}
              </p>
            </div>
          </div>
        </div>

        {/* התראות פיקוד העורף */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-1">
          <div className="p-3 sm:p-4 md:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-800 text-sm sm:text-base md:text-lg">
                {dynamicTitle('התראות', scanInterval)}
              </h3>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 sm:p-4">
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed break-words">
                {report.hfc_guidelines || "ללא עדכון"}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}