// Скрипт для инициализации базы данных MongoDB
db = db.getSiblingDB('edodb');

// Создание пользователя для приложения
db.createUser({
  user: 'edouser',
  pwd: 'edopassword',
  roles: [
    { role: 'readWrite', db: 'edodb' }
  ]
});

// Создание основных коллекций
db.createCollection('users');
db.createCollection('documents');
db.createCollection('apilogs');

// Добавление индексов для оптимизации запросов
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.documents.createIndex({ "createdBy": 1 });
db.documents.createIndex({ "status": 1 });
db.documents.createIndex({ "createdAt": 1 });
db.apilogs.createIndex({ "timestamp": 1 });
db.apilogs.createIndex({ "endpoint": 1 });

// Добавление тестового администратора для разработки
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2b$10$uPQrFkEXvb.3h5BU3DZMO.PkQdPZgOXTV1Yz6MLRw0NBof1SLyFM2", // хэш для пароля 'admin123'
  role: "admin",
  firstName: "Admin",
  lastName: "User",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB initialization completed successfully");
