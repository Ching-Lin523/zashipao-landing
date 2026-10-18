export function bookingError(message: string) {
  const errors: Record<string, string> = {
    AUTH_REQUIRED: '請先登入後再預約。', SESSION_NOT_FOUND: '找不到這場活動。',
    SESSION_CLOSED: '這場活動已開始或已停止預約，請選擇其他場次。',
    SESSION_FULL: '這場剛剛額滿了，請選擇其他場次。', ALREADY_BOOKED: '你已預約這場，請到「已預約場次」查看。',
    TASKS_REQUIRED: '請至少選擇一件待辦。', INVALID_TASKS: '部分待辦已完成、封存或移除，請重新整理再選擇。',
    BOOKING_NOT_FOUND: '找不到這筆預約，請重新整理確認。', SESSION_STARTED: '場次已開始，無法取消預約。'
  };
  return errors[message] ?? '未能確認操作結果，請先到「已預約場次」確認，再重試。';
}
export const sessionDate = (value: string) => new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).format(new Date(value));
export const sessionTime = (value: string) => new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
