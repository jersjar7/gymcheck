# 💪 GymCheck - Personal Workout Tracker

A simple, efficient personal fitness tracking website designed for university students who want to stay consistent with their workout and nutrition goals. Built specifically for use at university campus gyms with flexible scheduling around academic commitments.

## 🎯 Project Overview

GymCheck is a personal workout tracking website that helps you:
- **Stay consistent** with your fitness routine during busy school schedules
- **Track daily workouts** with easy check-off functionality  
- **Follow nutrition plans** tailored to your goals (lean gains, maintenance, muscle building)
- **Monitor progress** over time with simple metrics
- **Manage workout plans** monthly without coding

### Key Features

- **📅 Today View**: See today's workout and nutrition plan at a glance
- **📊 Week Overview**: Track weekly progress and upcoming workouts
- **🥗 Nutrition Tracking**: Complete meal plans with macro targets and timing
- **📈 Progress Monitoring**: Weight, measurements, strength gains, and photos
- **🔧 Admin Interface**: Password-protected plan management (no coding required)

## 🏫 Designed For University Life

**Summer Schedule (May-August):**
- Twice daily workouts (morning strength + afternoon cardio)
- Higher training volume with more time available

**School Schedule (September-April):**
- Once daily combined workouts (strength + cardio)
- Time-efficient 60-75 minute sessions
- Sunday rest days (gym closed)

## 🚀 Quick Setup

### 1. GitHub Pages Deployment
1. Fork or clone this repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → main branch
4. Your website will be available at `https://yourusername.github.io/gymcheck`

### 2. Initial Configuration
1. Update `/config/settings.json` with your preferences
2. Set your admin password in the settings
3. Verify `/config/active-plans.json` points to current month's plans

### 3. First Monthly Plans
1. Copy appropriate templates from `/templates/`
2. Fill in with your AI-generated workout and nutrition plans
3. Save to `/plans/2025/workouts/` and `/plans/2025/nutrition/`
4. Website will automatically load your plans!

## 📁 File Structure

```
gymcheck/
├── index.html                    # Main website
├── css/styles.css               # All styling
├── js/app.js                    # Website functionality
├── templates/                   # Reusable monthly templates
│   ├── workouts/
│   │   ├── twice-daily-template.json
│   │   └── once-daily-template.json
│   └── nutrition/
│       ├── lean-gains-template.json
│       ├── maintenance-template.json
│       └── muscle-building-template.json
├── plans/                       # Your actual monthly plans
│   └── 2025/
│       ├── workouts/
│       │   ├── august-2025-twice-daily.json
│       │   └── september-2025-once-daily.json
│       └── nutrition/
│           ├── august-2025-lean-gains.json
│           └── september-2025-maintenance.json
├── config/                      # Website configuration
│   ├── settings.json           # User preferences
│   └── active-plans.json       # Current active plans
└── progress/                    # Progress tracking data
    ├── monthly-progress-2025.json
    └── progress-photos/
```

## 🔄 Monthly Workflow

Adding new plans is simple and requires no coding:

### 1. Get Your AI-Generated Plan
- Use ChatGPT, Claude, or any AI to generate your monthly workout routine
- Specify your goals (fat loss, muscle gain, maintenance)
- Include your schedule constraints (twice daily vs once daily)

### 2. Use the Templates
- Copy appropriate template from `/templates/`
- **Summer**: Use `twice-daily-template.json`
- **School**: Use `once-daily-template.json`
- **Nutrition**: Choose based on goals (lean-gains, maintenance, muscle-building)

### 3. Fill in Your Plan
- Update dates, goals, and exercises from your AI plan
- Keep the JSON structure intact
- Save with naming convention: `month-year-type.json`

### 4. Upload & Activate
- Save files to appropriate `/plans/YEAR/` folders
- Scroll to bottom of website → Admin section
- Enter password: `onedayatatime`
- Website automatically switches plans on start dates

## 💡 Usage Tips

### Daily Use
- **Morning**: Check today's workout and nutrition plan
- **At Gym**: Use checkboxes to track completed exercises
- **Evening**: Add notes about how the workout felt

### Weekly Review
- Check Week View to see progress and upcoming workouts
- Adjust nutrition if needed based on energy levels
- Plan around your class schedule

### Monthly Planning
- Take progress photos first day of new month
- Update weight and measurements
- Set new monthly goals in your plan templates

## 🎛️ Admin Features

The password-protected admin interface allows you to:
- Upload new monthly workout plans
- Update nutrition plans and goals
- Preview plans before activating
- Switch between plan types (twice daily ↔ once daily)
- Validate JSON format to prevent errors

**Admin Password**: Set in `/config/settings.json`

## 🎯 Goal-Oriented Design

### Primary Goals
- **Lose stomach fat** while building/maintaining muscle
- **Stay consistent** with workouts despite busy school schedule
- **Maximize efficiency** in limited time slots
- **Track progress** without complicated systems

### Success Metrics
- Weekly workout consistency (aim for 90%+)
- Monthly strength improvements
- Body composition changes
- Energy levels and mood

## 🔧 Technical Details

- **Frontend Only**: Pure HTML/CSS/JavaScript (no server required)
- **GitHub Pages Compatible**: Deploys automatically
- **Mobile Responsive**: Works perfectly on phones at the gym
- **Offline Capable**: Service worker for gym use without internet
- **JSON-Driven**: All plans stored in simple JSON format

## 📚 Documentation

Detailed guides available in `/docs/`:
- **how-to-add-plans.md**: Step-by-step monthly plan updates
- **template-guide.md**: Customizing templates for your needs
- **workout-nutrition-coordination.md**: Aligning plans with goals

## 🤝 Contributing

This is a personal project, but feel free to:
- Fork for your own use
- Suggest improvements via issues
- Share your template modifications

## 📄 License

Personal use project. Feel free to fork and adapt for your own fitness journey!

---

**Built for consistency, designed for results. One day at a time. 💪**