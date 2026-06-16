import { HashRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './src/components/ProtectedRoute';
import Home from './src/screen/Home';
import Features from './src/screen/Features';
import Pricing from './src/screen/Pricing';
import About from './src/screen/About';
import Contact from './src/screen/Contact';
import Login from './src/screen/auth/Login';
import Register from './src/screen/auth/Register';
import ForgotPassword from './src/screen/auth/ForgotPassword';
import ConfirmPassword from './src/screen/auth/ConfirmPassword';
import ResetPassword from './src/screen/auth/ResetPassword';
import VerifyResetCode from './src/screen/auth/VerifyResetCode';
import VerifyEmail from './src/screen/auth/VerifyEmail';
import Onboarding from './src/screen/onboarding/Onboarding';
import Overview from './src/screen/dashboard/Overview';
import FoodDiary from './src/screen/dashboard/FoodDiary';
import MealPlanner from './src/screen/dashboard/MealPlanner';
import BarcodeScanner from './src/screen/dashboard/BarcodeScanner';
import MealScan from './src/screen/dashboard/MealScan';
import Recipes from './src/screen/dashboard/Recipes';
import CustomFoods from './src/screen/dashboard/CustomFoods';
import GroceryList from './src/screen/dashboard/GroceryList';
import Nutrition from './src/screen/dashboard/Nutrition';
import DietRecommender from './src/screen/dashboard/DietRecommender';
import Goals from './src/screen/dashboard/Goals';
import Exercise from './src/screen/dashboard/Exercise';
import Workouts from './src/screen/dashboard/Workouts';
import Water from './src/screen/dashboard/Water';
import WeeklyCalendar from './src/screen/dashboard/WeeklyCalendar';
import Progress from './src/screen/dashboard/Progress';
import Restaurants from './src/screen/dashboard/Restaurants';
import Friends from './src/screen/dashboard/Friends';
import Messages from './src/screen/dashboard/Messages';
import Settings from './src/screen/dashboard/Settings';
import AdminOverview from './src/screen/admin/AdminOverview';
import AdminUsers from './src/screen/admin/AdminUsers';
import AdminContactMessages from './src/screen/admin/AdminContactMessages';
import AdminRecipes from './src/screen/admin/AdminRecipes';
import AdminCustomFoods from './src/screen/admin/AdminCustomFoods';
import AdminBarcodeFoods from './src/screen/admin/AdminBarcodeFoods';
import AdminFoodDiary from './src/screen/admin/AdminFoodDiary';
import AdminMealPlans from './src/screen/admin/AdminMealPlans';
import AdminWaterLogs from './src/screen/admin/AdminWaterLogs';
import AdminProgressEntries from './src/screen/admin/AdminProgressEntries';
import AdminWorkoutLogs from './src/screen/admin/AdminWorkoutLogs';
import AdminWorkoutRoutines from './src/screen/admin/AdminWorkoutRoutines';
import AdminDietRecommendations from './src/screen/admin/AdminDietRecommendations';
import AdminGoals from './src/screen/admin/AdminGoals';
import AdminGroceryItems from './src/screen/admin/AdminGroceryItems';
import AdminMealScans from './src/screen/admin/AdminMealScans';
import AdminWeeklyCalendar from './src/screen/admin/AdminWeeklyCalendar';
import AdminPasswordResetCodes from './src/screen/admin/AdminPasswordResetCodes';
import AdminOnboardingDetails from './src/screen/admin/AdminOnboardingDetails';


const stats = [
  { label: 'Foods tracked', value: '42k+' },
  { label: 'Daily plans created', value: '18k' },
  { label: 'Avg adherence lift', value: '31%' },
];

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home stats={stats} />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-code" element={<VerifyResetCode />} />
        <Route path="/confirm-password" element={<ConfirmPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/dashboard/food-diary" element={<ProtectedRoute><FoodDiary /></ProtectedRoute>} />
        <Route path="/dashboard/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
        <Route path="/dashboard/barcode-scanner" element={<ProtectedRoute><BarcodeScanner /></ProtectedRoute>} />
        <Route path="/dashboard/meal-scan" element={<ProtectedRoute><MealScan /></ProtectedRoute>} />
        <Route path="/dashboard/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/dashboard/custom-foods" element={<ProtectedRoute><CustomFoods /></ProtectedRoute>} />
        <Route path="/dashboard/grocery-list" element={<ProtectedRoute><GroceryList /></ProtectedRoute>} />
        <Route path="/dashboard/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
        <Route path="/dashboard/diet-recommender" element={<ProtectedRoute><DietRecommender /></ProtectedRoute>} />
        <Route path="/dashboard/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/dashboard/exercise" element={<ProtectedRoute><Exercise /></ProtectedRoute>} />
        <Route path="/dashboard/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
        <Route path="/dashboard/water" element={<ProtectedRoute><Water /></ProtectedRoute>} />
        <Route path="/dashboard/weekly-calendar" element={<ProtectedRoute><WeeklyCalendar /></ProtectedRoute>} />
        <Route path="/dashboard/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/dashboard/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
        <Route path="/dashboard/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/contact-messages" element={<ProtectedRoute><AdminContactMessages /></ProtectedRoute>} />
        <Route path="/admin/recipes" element={<ProtectedRoute><AdminRecipes /></ProtectedRoute>} />
        <Route path="/admin/custom-foods" element={<ProtectedRoute><AdminCustomFoods /></ProtectedRoute>} />
        <Route path="/admin/barcode-foods" element={<ProtectedRoute><AdminBarcodeFoods /></ProtectedRoute>} />
        <Route path="/admin/food-diary" element={<ProtectedRoute><AdminFoodDiary /></ProtectedRoute>} />
        <Route path="/admin/meal-plans" element={<ProtectedRoute><AdminMealPlans /></ProtectedRoute>} />
        <Route path="/admin/water-logs" element={<ProtectedRoute><AdminWaterLogs /></ProtectedRoute>} />
        <Route path="/admin/progress-entries" element={<ProtectedRoute><AdminProgressEntries /></ProtectedRoute>} />
        <Route path="/admin/workout-logs" element={<ProtectedRoute><AdminWorkoutLogs /></ProtectedRoute>} />
        <Route path="/admin/workout-routines" element={<ProtectedRoute><AdminWorkoutRoutines /></ProtectedRoute>} />
        <Route path="/admin/diet-recommendations" element={<ProtectedRoute><AdminDietRecommendations /></ProtectedRoute>} />
        <Route path="/admin/goals" element={<ProtectedRoute><AdminGoals /></ProtectedRoute>} />
        <Route path="/admin/grocery-items" element={<ProtectedRoute><AdminGroceryItems /></ProtectedRoute>} />
        <Route path="/admin/meal-scans" element={<ProtectedRoute><AdminMealScans /></ProtectedRoute>} />
        <Route path="/admin/weekly-calendar" element={<ProtectedRoute><AdminWeeklyCalendar /></ProtectedRoute>} />
        <Route path="/admin/password-reset-codes" element={<ProtectedRoute><AdminPasswordResetCodes /></ProtectedRoute>} />
        <Route path="/admin/onboarding-details" element={<ProtectedRoute><AdminOnboardingDetails /></ProtectedRoute>} />

      </Routes>
    </HashRouter>
  );
}

export default App;
