export type Task = {
  id: number;
  weeklyGoalId?: string;
  occurrenceWeek?: string;
  occurrenceNumber?: number;
  title: string;
  deadline: string;
  firstNoticed: string;
  archived?: boolean;
  completed?: boolean;
  priority?: boolean;
  note?: string;
  order?: number;
};

const demoToday = "2026-05-17";

export const initialTasks: Task[] = [
  {
    id: 1,
    title: "補齊所得稅延期申報資料",
    deadline: "2026-05-24",
    firstNoticed: "2026-03-16",
    priority: true,
    note: "先找扣繳憑單和去年申報資料"
  },
  {
    id: 2,
    title: "更新護照照片預約",
    deadline: "2026-06-05",
    firstNoticed: "2026-04-02",
    note: "查附近照相館，確認週末時間"
  },
  {
    id: 3,
    title: "預約牙醫洗牙",
    deadline: "2026-05-30",
    firstNoticed: "2026-05-03",
    note: "打電話或線上預約即可"
  },
  {
    id: 4,
    title: "整理五月份收據",
    deadline: "2026-06-15",
    firstNoticed: "2026-05-08"
  },
  {
    id: 5,
    title: "研究媽媽保單內容並做摘要",
    deadline: "2026-05-28",
    firstNoticed: "2026-02-20",
    note: "先找保單，再列出看不懂的地方"
  },
  {
    id: 6,
    title: "退 iHerb 重複訂單",
    deadline: "2026-05-20",
    firstNoticed: "2026-05-09"
  }
];


const key = "zashipao:tasks:v1";
export function readTasks(): Task[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    if (Array.isArray(value) && value.every(t => typeof t.id === "number" && typeof t.title === "string" && typeof t.deadline === "string" && typeof t.firstNoticed === "string")) return value;
  } catch {}
  return initialTasks;
}
export function writeTasks(tasks: Task[]) {
  localStorage.setItem(key, JSON.stringify(tasks));
  window.dispatchEvent(new Event("zashipao-tasks"));
}
