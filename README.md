# स्मार्ट टोकन व कतार प्रबंधन प्रणाली (Smart Token & Queue Manager)

QR कोड आधारित डिजिटल टोकन और 10-मिनट स्वचालित समय स्लॉट प्रबंधन प्रणाली।

## 🚀 GitHub Pages पर होस्ट करने के चरण (Hosting on GitHub Pages)

यह प्रोजेक्ट GitHub Pages (स्टेटिक होस्टिंग) और फुल-स्टैक नोड सर्वर (Cloud Run / Render) दोनों के लिए 100% अनुकूलित (Universal Ready) है।

### चरण 1: GitHub पर नया रिपॉजिटरी बनाएं
1. अपने [GitHub](https://github.com) खाते में लॉगिन करें।
2. **New Repository** बनाएं और नाम दें: `Tokensewa`
3. Repository को **Public** रखें।

### चरण 2: कोड को GitHub पर पुश करें (Push to GitHub)
अपने टर्मिनल / Git बैश में निम्नलिखित कमांड्स चलाएं:
```bash
git init
git add .
git commit -m "Initial commit for GitHub Pages launch"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/Tokensewa.git
git push -u origin main
```
*(नोट: `<YOUR_GITHUB_USERNAME>` की जगह अपना GitHub यूजरनेम लिखें)*

### चरण 3: GitHub Pages सक्रिय करें (Enable GitHub Pages)
1. GitHub पर अपनी रिपॉजिटरी के **Settings** टैब में जाएं।
2. बाएं मेन्यू से **Pages** पर क्लिक करें।
3. **Build and deployment** के तहत **Source** को **"GitHub Actions"** चुनें।
4. बस! `.github/workflows/deploy.yml` फाइल स्वतः चलने लगेगी और कुछ ही मिनटों में आपकी वेबसाइट लाइव हो जाएगी:
   👉 **`https://<YOUR_GITHUB_USERNAME>.github.io/Tokensewa/`**

---

## 🔑 एडमिन एवं ऑपरेटर लॉगिन पासवर्ड (Login PINs)

- **👑 Admin (Owner) Password:** `2810`
- **👔 Staff 1 Password:** `2811`
- **👔 Staff 2 Password:** `2580`

---

## ✨ प्रमुख विशेषताएं (Features)

- **12-अंकों का आधार अनिवार्य (Mandatory 12-digit Aadhaar):** प्रत्येक टोकन बुकिंग हेतु आधार नंबर अनिवार्य है।
- **1 आधार = 1 टोकन सुरक्षा:** एक आधार कार्ड पर एक समय में केवल एक ही सक्रिय टोकन बुक हो सकता है।
- **10-मिनट स्वचालित स्लॉट:** 1-क्लिक में तुरंत अगला 10-मिनट का स्लॉट मिलता है।
- **ऑटोमैटिक रविवार अवकाश नियम:** रविवार को केंद्र स्वतः बंद रहता है और अगले कार्यदिवस (सोमवार सुबह) का टोकन दिया जाता है।
- **आवाज घोषणा (Voice & Audio Calling):** ऑपरेटर काउंटर से हिंदी में टोकन पुकार सकते हैं।
- **पूर्णतः ऑफलाइन एवं क्रॉस-टैब सिंक:** GitHub Pages पर भी डेटा लोकल स्टोरेज में सुरक्षित रहता है और कई टैब एक साथ रियल-टाइम सिंक होते हैं।
