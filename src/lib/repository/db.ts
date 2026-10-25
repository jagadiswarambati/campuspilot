import fs from "fs";
import path from "path";
import {
  StudentProfile,
  TimetableClass,
  CampusLocation,
  WalkingTime,
  PrintShop,
  Canteen,
  MenuItem,
  CoordinatedPlan,
  PrintOrder,
  FoodOrder,
  AttendanceRecord,
  StudentNote,
} from "../../types";
import {
  DEFAULT_STUDENT,
  CAMPUS_LOCATIONS,
  WALKING_TIMES,
  PRINT_SHOPS,
  CANTEENS,
  MENU_ITEMS,
  TIMETABLE_CLASSES,
  ATTENDANCE_RECORDS,
  STUDENT_NOTES,
} from "../seed-data";

export interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  student: StudentProfile;
  locations: CampusLocation[];
  walkingTimes: WalkingTime[];
  printShops: PrintShop[];
  canteens: Canteen[];
  menuItems: MenuItem[];
  timetable: TimetableClass[];
  attendance: AttendanceRecord[];
  notes: StudentNote[];
  plans: CoordinatedPlan[];
  printOrders: PrintOrder[];
  foodOrders: FoodOrder[];
}

function getDefaultDatabase(): DatabaseSchema {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    student: { ...DEFAULT_STUDENT },
    locations: [...CAMPUS_LOCATIONS],
    walkingTimes: [...WALKING_TIMES],
    printShops: [...PRINT_SHOPS],
    canteens: [...CANTEENS],
    menuItems: [...MENU_ITEMS],
    timetable: [...TIMETABLE_CLASSES],
    attendance: [...ATTENDANCE_RECORDS],
    notes: [...STUDENT_NOTES],
    plans: [],
    printOrders: [],
    foodOrders: [],
  };
}

export class JsonRepository {
  private dbFilePath: string;

  constructor(filePath?: string) {
    const configuredPath =
      filePath || process.env.DATABASE_PATH || "./data/campus-pilot.json";
    this.dbFilePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);
  }

  public getFilePath(): string {
    return this.dbFilePath;
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public read(): DatabaseSchema {
    this.ensureDirectory();
    if (!fs.existsSync(this.dbFilePath)) {
      const defaultData = getDefaultDatabase();
      this.write(defaultData);
      return defaultData;
    }

    try {
      const raw = fs.readFileSync(this.dbFilePath, "utf-8");
      if (!raw || raw.trim() === "") {
        const defaultData = getDefaultDatabase();
        this.write(defaultData);
        return defaultData;
      }
      const data = JSON.parse(raw) as DatabaseSchema;
      return data;
    } catch (err) {
      console.error("Failed to parse database file, re-seeding default data:", err);
      const defaultData = getDefaultDatabase();
      this.write(defaultData);
      return defaultData;
    }
  }

  public write(data: DatabaseSchema): void {
    this.ensureDirectory();
    data.lastUpdated = new Date().toISOString();
    const content = JSON.stringify(data, null, 2);
    // Atomic write via temp file
    const tempFile = `${this.dbFilePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, content, "utf-8");
    fs.renameSync(tempFile, this.dbFilePath);
  }

  public reset(): DatabaseSchema {
    const defaultData = getDefaultDatabase();
    this.write(defaultData);
    return defaultData;
  }

  // Student Profile
  public getStudentProfile(): StudentProfile {
    return this.read().student;
  }

  public updateStudentProfile(profile: Partial<StudentProfile>): StudentProfile {
    const data = this.read();
    data.student = { ...data.student, ...profile };
    this.write(data);
    return data.student;
  }

  // Locations & Walking Times
  public getLocations(): CampusLocation[] {
    return this.read().locations;
  }

  public getWalkingMinutes(fromId: string, toId: string): number {
    if (fromId === toId) return 0;
    const data = this.read();
    const match = data.walkingTimes.find(
      (w) =>
        (w.fromLocationId === fromId && w.toLocationId === toId) ||
        (w.fromLocationId === toId && w.toLocationId === fromId)
    );
    // Default estimated campus walk if not explicitly in matrix: 4 minutes
    return match ? match.minutes : 4;
  }

  // Print Shops
  public getPrintShops(): PrintShop[] {
    return this.read().printShops;
  }

  public getPrintShop(id: string): PrintShop | undefined {
    return this.read().printShops.find((s) => s.id === id);
  }

  // Canteens & Menus
  public getCanteens(): Canteen[] {
    return this.read().canteens;
  }

  public getCanteen(id: string): Canteen | undefined {
    return this.read().canteens.find((c) => c.id === id);
  }

  public getMenuItems(canteenId?: string): MenuItem[] {
    const items = this.read().menuItems;
    if (canteenId) {
      return items.filter((item) => item.canteenId === canteenId);
    }
    return items;
  }

  public getMenuItem(id: string): MenuItem | undefined {
    return this.read().menuItems.find((item) => item.id === id);
  }

  // Timetable
  public getTimetable(): TimetableClass[] {
    return this.read().timetable;
  }

  public addTimetableClass(cls: Omit<TimetableClass, "id">): TimetableClass {
    const data = this.read();
    const newClass: TimetableClass = {
      ...cls,
      id: `class-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    data.timetable.push(newClass);
    this.write(data);
    return newClass;
  }

  public updateTimetableClass(cls: TimetableClass): TimetableClass {
    const data = this.read();
    data.timetable = data.timetable.map((c) => (c.id === cls.id ? cls : c));
    this.write(data);
    return cls;
  }

  public deleteTimetableClass(id: string): boolean {
    const data = this.read();
    const initialLen = data.timetable.length;
    data.timetable = data.timetable.filter((c) => c.id !== id);
    if (data.timetable.length !== initialLen) {
      this.write(data);
      return true;
    }
    return false;
  }

  // Attendance
  public getAttendance(): AttendanceRecord[] {
    return this.read().attendance;
  }

  public updateAttendance(record: AttendanceRecord): AttendanceRecord {
    const data = this.read();
    const index = data.attendance.findIndex((a) => a.id === record.id);
    if (index >= 0) {
      data.attendance[index] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      data.attendance.push({ ...record, updatedAt: new Date().toISOString() });
    }
    this.write(data);
    return record;
  }

  // Notes
  public getNotes(): StudentNote[] {
    return this.read().notes;
  }

  public addNote(note: Omit<StudentNote, "id" | "createdAt" | "updatedAt">): StudentNote {
    const data = this.read();
    const now = new Date().toISOString();
    const newNote: StudentNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      updatedAt: now,
    };
    data.notes.unshift(newNote);
    this.write(data);
    return newNote;
  }

  public updateNote(note: StudentNote): StudentNote {
    const data = this.read();
    const now = new Date().toISOString();
    data.notes = data.notes.map((n) =>
      n.id === note.id ? { ...note, updatedAt: now } : n
    );
    this.write(data);
    return note;
  }

  public deleteNote(id: string): boolean {
    const data = this.read();
    const initialLen = data.notes.length;
    data.notes = data.notes.filter((n) => n.id !== id);
    if (data.notes.length !== initialLen) {
      this.write(data);
      return true;
    }
    return false;
  }

  // Coordinated Plans
  public getPlans(): CoordinatedPlan[] {
    return this.read().plans;
  }

  public getPlan(id: string): CoordinatedPlan | undefined {
    return this.read().plans.find((p) => p.id === id);
  }

  public savePlan(plan: CoordinatedPlan): CoordinatedPlan {
    const data = this.read();
    const index = data.plans.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      data.plans[index] = plan;
    } else {
      data.plans.unshift(plan);
    }
    this.write(data);
    return plan;
  }

  // Orders
  public getPrintOrders(): PrintOrder[] {
    return this.read().printOrders;
  }

  public addPrintOrder(order: PrintOrder): PrintOrder {
    const data = this.read();
    data.printOrders.unshift(order);
    this.write(data);
    return order;
  }

  public updatePrintOrderStatus(id: string, status: PrintOrder["status"]): PrintOrder | undefined {
    const data = this.read();
    const order = data.printOrders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      this.write(data);
      return order;
    }
    return undefined;
  }

  public getFoodOrders(): FoodOrder[] {
    return this.read().foodOrders;
  }

  public addFoodOrder(order: FoodOrder): FoodOrder {
    const data = this.read();
    data.foodOrders.unshift(order);
    this.write(data);
    return order;
  }

  public updateFoodOrderStatus(id: string, status: FoodOrder["status"]): FoodOrder | undefined {
    const data = this.read();
    const order = data.foodOrders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      this.write(data);
      return order;
    }
    return undefined;
  }
}

// Singleton repository instance
let repoInstance: JsonRepository | null = null;

export function getRepository(): JsonRepository {
  if (!repoInstance) {
    repoInstance = new JsonRepository();
  }
  return repoInstance;
}
