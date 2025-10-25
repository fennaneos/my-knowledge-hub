// lib/calendars.ts
export type HolidayCalendarId = "XPAR"|"XNYS"|"XLON"|"TARGET"|"USD"|"EUR"|"GBP"|"JPY";
export type BizDayAdj = "Following"|"ModifiedFollowing"|"Preceding"|"None";
export type DayCount = "ACT/365F"|"ACT/360"|"30/360"|"ACT/ACT-ISDA";
export type FixingLag = { days:number; unit:"Business"|"Calendar"; cal:HolidayCalendarId; adj:BizDayAdj };
export type SettlementRule = { lag:number; unit:"Business"|"Calendar"; cal:HolidayCalendarId; adj:BizDayAdj }; // e.g. T+2

export interface MarketConventions {
  currency: "USD"|"EUR"|"GBP"|"JPY";
  dayCount: DayCount;               // for carry/discounting when relevant
  businessCalendar: HolidayCalendarId;
  spotLag?: SettlementRule;         // FX spot T+2, equities T+2
  fixingLag?: FixingLag;            // options fixings if needed
}
