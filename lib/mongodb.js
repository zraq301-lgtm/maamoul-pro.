import { MongoClient } from "mongodb";

// التحقق من وجود رابط الاتصال في بيئة التشغيل
if (!process.env.MONGODB_URI) {
  throw new Error('الرجاء إضافة متغير MONGODB_URI إلى إعدادات Vercel Environment Variables');
}

const uri = process.env.MONGODB_URI;
const options = {
  // إعدادات إضافية لضمان استقرار الاتصال في البيئات السحابية
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // في وضع التطوير، نستخدم كائن global للحفاظ على الاتصال مفتوحاً عند عمل Hot Reload للكود
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // في وضع الإنتاج (Production) على Vercel، نقوم بإنشاء اتصال مباشر
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// تصدير الوعد (Promise) ليكون متاحاً لملفات الـ API
export default clientPromise;
