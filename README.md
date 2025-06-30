# 💪 Jerson's Exercise Routine - Personal Workout Tracker

A streamlined, efficient personal workout tracking website designed for university students who want to stay consistent with their fitness routine. Built specifically for use at campus gyms with flexible scheduling around academic commitments.

## 🎯 Project Overview

Jerson's Exercise Routine is a personal workout tracking website that helps you:
- **Stay consistent** with your fitness routine during busy school schedules
- **Track daily workouts** with easy check-off functionality  
- **Monitor daily cardio** with integrated treadmill running tracking
- **Monitor progress** over time with simple metrics
- **Manage workout plans** monthly without coding

### Key Features

- **📅 Today View**: See today's workout plan at a glance with hardcoded cardio tracking
- **📊 Week Overview**: Track weekly progress and upcoming workouts
- **📈 Progress Monitoring**: Weight, measurements, strength gains, and photos
- **🔧 Admin Interface**: Password-protected plan management (no coding required)
- **🏃 Integrated Cardio**: Daily treadmill running automatically included

## 🏫 Designed For University Life

**Daily Schedule:**
- One comprehensive workout session (45-75 minutes)
- Daily treadmill cardio (30-45 minutes) - tracked separately
- Sunday rest days (gym closed)
- Time-efficient sessions that fit around class schedules

**Nutrition Tracking:**
- Uses MyFitnessPal app for calorie and macro tracking
- Website focuses exclusively on workout routines
- No built-in nutrition features needed

## 🚀 Quick Setup

### 1. GitHub Pages Deployment
1. Fork or clone this repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → main branch
4. Your website will be available at `https://yourusername.github.io/workout-tracker`

### 2. Initial Configuration
1. Update `/config/settings.json` with your preferences
2. Set your admin password in the settings
3. Verify `/config/active-plans.json` points to current month's plan

### 3. First Monthly Plan
1. Create workout plan JSON file with daily routines
2. Save to `/plans/2025/workouts/`
3. Website will automatically load your plan!

## 📁 File Structure

```
workout-tracker/
├── index.html                    # Main website
├── css/styles.css               # All styling
├── js/app.js                    # Website functionality
├── plans/                       # Your monthly workout plans
│   └── 2025/
│       └── workouts/
│           ├── june-2025-once-daily.json
│           └── july-2025-once-daily.json
├── config/                      # Website configuration
│   ├── settings.json           # User preferences
│   └── active-plans.json       # Current active plan
└── progress/                    # Progress tracking data
    ├── monthly-progress-2025.json
    └── progress-photos/
```

## 🔄 Monthly Workflow

Adding new plans is simple and requires no coding:

### 1. Get Your AI-Generated Plan
- Use ChatGPT, Claude, or any AI to generate your monthly workout routine
- Specify your goals (strength, endurance, general fitness)
- Include your schedule constraints (university life)

### 2. Create the JSON Structure
- Each day should include exercises with sets, reps, and notes
- Cardio is automatically included as daily treadmill running
- Save with naming convention: `month-year-once-daily.json`

### 3. Upload & Activate
- Save files to `/plans/YEAR/workouts/` folder
- Scroll to bottom of website → Admin section
- Enter password: `onedayatatime`
- Website automatically switches plans on start dates

## 💡 Usage Tips

### Daily Use
- **Morning**: Check today's workout plan
- **At Gym**: Use checkboxes to track completed exercises
- **After Gym**: Mark cardio complete and add notes

### Weekly Review
- Check Week View to see progress and upcoming workouts
- Adjust plans if needed based on energy levels
- Plan around your class schedule

### Monthly Planning
- Take progress photos first day of new month
- Update weight and measurements
- Set new monthly goals in your plan

## 🎛️ Admin Features

The password-protected admin interface allows you to:
- Upload new monthly workout plans
- Preview plans before activating
- Switch between plan types
- Validate JSON format to prevent errors

**Admin Password**: Set in `/config/settings.json`

## 🎯 Goal-Oriented Design

### Primary Goals
- **Stay consistent** with workouts despite busy school schedule
- **Track progress** without complicated systems
- **Maximize efficiency** in limited time slots
- **Build sustainable habits** around academic commitments

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

## 📚 JSON Plan Structure

```json
{
  "planInfo": {
    "month": "July 2025",
    "planType": "Once Daily - University Schedule",
    "monthlyGoals": {...}
  },
  "weeks": {
    "week1": {
      "days": {
        "day1": {
          "date": "2025-07-01",
          "dayType": "workout",
          "workout": {
            "workoutType": "Upper Body Strength",
            "exercises": [
              {
                "name": "Chest Press Machine",
                "sets": 4,
                "reps": "8-10",
                "notes": "Focus on form"
              }
            ]
          }
        }
      }
    }
  }
}
```

## 🤝 Contributing

This is a personal project, but feel free to:
- Fork for your own use
- Suggest improvements via issues
- Share your plan templates

## 📄 License

Personal use project. Feel free to fork and adapt for your own fitness journey!

---

**Built for consistency, designed for results. One day at a time. 💪**

*Note: Nutrition tracking handled separately via MyFitnessPal app. This website focuses exclusively on workout routine management and progress tracking.*