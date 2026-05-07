import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('الرجاء إضافة متغير MONGODB_URI إلى إعدادات Vercel');
}

const uri = process.env.MONGODB_URI;

// بدلاً من تركها فارغة تماماً، سنترك الكائن موجوداً لضمان استقرار التعريف
const options = {}; 

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // في وضع التطوير، نستخدم المتغير العالمي لمنع تكرار الاتصالات
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // في وضع الإنتاج على فيرسل
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// تصدير الوعد
export default clientPromise;
