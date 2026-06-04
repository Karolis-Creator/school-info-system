# 🏫 Mokyklos informacinė sistema — Pilnas diegimo vadovas

## Technologijų stack
- **Frontend**: React 18 + React Router
- **Backend/DB**: Firebase (Firestore + Auth)
- **Hosting**: GitHub Pages arba Firebase Hosting
- **Stilius**: Custom CSS (bordo tema)

---

## 1️⃣ Firebase projekto sukūrimas

### 1.1 Sukurkite Firebase projektą
1. Eikite į [console.firebase.google.com](https://console.firebase.google.com)
2. Spustelėkite **"Add project"** (Pridėti projektą)
3. Įveskite pavadinimą, pvz. `mokykla-sistema`
4. Išjunkite Google Analytics (neprivaloma) → **"Create project"**

### 1.2 Pridėkite Web app
1. Projekto puslapyje spustelėkite **`</>`** (Web) ikoną
2. Įveskite app pavadinimą: `mokykla-web`
3. Pažymėkite **"Also set up Firebase Hosting"** ✅
4. Spustelėkite **"Register app"**
5. **SVARBU**: Nukopijuokite `firebaseConfig` objektą — jis atrodo taip:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mokykla-sistema.firebaseapp.com",
  projectId: "mokykla-sistema",
  storageBucket: "mokykla-sistema.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 1.3 Įjunkite Authentication
1. Kairėje meniu: **Authentication** → **"Get started"**
2. **Sign-in method** → Įjunkite:
   - ✅ **Email/Password** (administratoriams)
   - ✅ **Anonymous** (mokiniams)

### 1.4 Sukurkite Firestore duomenų bazę
1. Kairėje meniu: **Firestore Database** → **"Create database"**
2. Pasirinkite **"Start in production mode"**
3. Pasirinkite serverio vietą: `europe-west1` (Belgija — artimiausia)

### 1.5 Firestore saugumo taisyklės
Eikite į **Firestore → Rules** ir pakeiskite į:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Pagalbinės funkcijos
    function isAuth() {
      return request.auth != null;
    }
    function isSuperAdmin() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    function isAdmin(schoolId) {
      return isAuth() && (
        isSuperAdmin() ||
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolId == schoolId)
      );
    }
    function isSchoolMember(schoolId) {
      return isAuth() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.schoolId == schoolId;
    }

    // Users — tik superadmin gali kurti, kiekvienas gali skaityti savo
    match /users/{userId} {
      allow read: if isAuth() && (request.auth.uid == userId || isSuperAdmin());
      allow create: if isAuth();
      allow update: if isAuth() && (request.auth.uid == userId || isSuperAdmin());
      allow delete: if isSuperAdmin();
    }

    // Schools — tik superadmin gali kurti/keisti
    match /schools/{schoolId} {
      allow read: if isAuth();
      allow write: if isSuperAdmin();
    }

    // Teachers, Events, Announcements, Consultations
    // Skaityti gali visi mokyklos nariai, keisti tik adminai
    match /teachers/{docId} {
      allow read: if isAuth() && isSchoolMember(resource.data.schoolId);
      allow write: if isAuth() && isAdmin(request.resource.data.schoolId);
    }
    match /events/{docId} {
      allow read: if isAuth() && isSchoolMember(resource.data.schoolId);
      allow write: if isAuth() && isAdmin(request.resource.data.schoolId);
    }
    match /announcements/{docId} {
      allow read: if isAuth() && isSchoolMember(resource.data.schoolId);
      allow write: if isAuth() && isAdmin(request.resource.data.schoolId);
    }
    match /consultations/{docId} {
      allow read: if isAuth() && isSchoolMember(resource.data.schoolId);
      allow write: if isAuth() && isAdmin(request.resource.data.schoolId);
    }
  }
}
```

Spustelėkite **"Publish"**

---

## 2️⃣ Jūsų Super Admin paskyros sukūrimas

Jūs esate **vienintelis** žmogus, galintis registruoti mokyklas ir administratorius.

### 2.1 Sukurkite savo paskyrą Firebase Auth
1. **Firebase Console → Authentication → Users → Add user**
2. Įveskite savo el. paštą ir slaptažodį
3. Paspauskite **"Add user"** — pamatysite UID (pvz. `abc123xyz`)

### 2.2 Sukurkite savo Firestore dokumentą
1. **Firestore → Data → Start collection**: `users`
2. **Document ID**: jūsų UID (iš aukščiau)
3. Pridėkite šiuos laukus:
   - `uid` (string): jūsų UID
   - `email` (string): jūsų el. paštas
   - `displayName` (string): jūsų vardas
   - `role` (string): **`superadmin`** ← labai svarbu!
   - `schoolId` (string): palikite tuščią arba `superadmin`
   - `createdAt` (timestamp): dabar

### 2.3 Atnaujinkite Firestore taisykles kūrimo metu
Kol nėra jokio superadmin dokumento, laikinai naudokite `allow write: if true;` ir po nustatymo grąžinkite į saugias taisykles.

---

## 3️⃣ Projekto konfigūracija

### 3.1 Atsisiųskite ir instaliuokite
```bash
# Klonuokite arba atsisiųskite projektą
cd school-app

# Instaliuokite priklausomybes
npm install
```

### 3.2 Įdėkite Firebase konfigūraciją
Atidarykite `src/lib/firebase.js` ir pakeiskite `YOUR_*` reikšmes savo konfigūracija:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← jūsų reikšmės
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3.3 Paleiskite lokaliai
```bash
npm start
```
Atidarykite [http://localhost:3000](http://localhost:3000)

---

## 4️⃣ GitHub ir Firebase Hosting

### 4.1 Sukurkite GitHub repozitoriją
```bash
cd school-app
git init
git add .
git commit -m "Initial commit: mokyklos sistema"

# GitHub.com → New repository → school-info-system
git remote add origin https://github.com/JUSU_VARDAS/school-info-system.git
git branch -M main
git push -u origin main
```

### 4.2 Firebase Hosting diegimas
```bash
# Instaliuokite Firebase CLI
npm install -g firebase-tools

# Prisijunkite
firebase login

# Inicializuokite (projekto aplanke)
firebase init hosting

# Atsakykite į klausimus:
# ? What do you want to use as your public directory? build
# ? Configure as a single-page app? Yes
# ? Set up automatic builds with GitHub? Yes (rekomenduojama)
# ? File build/index.html already exists. Overwrite? No

# Sukurkite production build
npm run build

# Publikuokite
firebase deploy --only hosting
```

### 4.3 GitHub Actions automatinis diegimas (rekomenduojama)
Sukurkite `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: JUSU_PROJECT_ID
```

**Svarbu**: Pridėkite `FIREBASE_SERVICE_ACCOUNT` secret GitHub repozitorijoje
(Settings → Secrets → New secret)

---

## 5️⃣ Naudojimas

### Mokyklos sukūrimas
1. Prisijunkite kaip **Super Admin**
2. Eikite į **⚡ Super Admin** skyrių
3. Spustelėkite **"Nauja mokykla"**
4. Įveskite pavadinimą, sistema sugeneruos prisijungimo kodą
5. Saugokite kodą — jį gausite mokiniams

### Administratoriaus registravimas
1. Super Admin skyriuje spustelėkite **"Naujas admin"**
2. Įveskite vardą, el. paštą, slaptažodį, pasirinkite mokyklą
3. Administratorius gali prisijungti per Admin skirtuką

### Mokinio prisijungimas
1. Pagrindiniame puslapyje pasirinkite **"Mokinys"**
2. Įveskite mokyklos kodą (duoda administratorius)
3. Įveskite savo vardą
4. Mokiniai mato duomenis, bet negali jų keisti

### Duomenų valdymas (tik Admin)
- **+** mygtukai atsiranda tik administratoriams
- Galima pridėti, redaguoti, ištrinti mokytojus, renginius, skelbimus, konsultacijas
- Visi pakeitimai išsaugomi realiu laiku Firebase

---

## 🗄️ Duomenų struktūra Firestore

```
/users/{uid}
  - uid, email, displayName, role, schoolId, createdAt

/schools/{id}
  - name, accessCode, active, createdAt

/teachers/{id}
  - name, subject, room, building, email, phone, schoolId, createdAt

/events/{id}
  - title, date, end_date, time, location, description, type, schoolId

/announcements/{id}
  - title, content, date, type, urgent, schoolId

/consultations/{id}
  - teacher_name, subject, day_of_week, time_start, time_end, room, notes, schoolId
```

---

## ❓ Dažni klausimai

**K: Kodėl matau "Firestore: Missing or insufficient permissions"?**
A: Patikrinkite Firestore taisykles. Įsitikinkite, kad jūsų vartotojo dokumentas turi teisingą `role` lauką.

**K: Kaip pakeisti mokyklos prisijungimo kodą?**
A: Super Admin puslapyje spustelėkite mokyklos kodą ir jį atnaujinkite tiesiai Firestore konsolėje.

**K: Ar galiu naudoti tą pačią sistemą kelioms mokykloms?**
A: Taip! Kiekviena mokykla turi savo duomenis, atskirus administratorius ir mokinio prisijungimo kodus.

**K: Kaip įkelti aukšto plano nuotraukas?**
A: Šiuo metu sistema rodo kabinetus kaip sąrašą. Ateityje galima pridėti Firebase Storage integraciją nuotraukų įkėlimui.

---

## 📞 Kontaktai ir palaikymas

Sistemos kūrėjas gali suteikti prieigą prie Super Admin funkcijų arba sukurti naują mokyklą.
