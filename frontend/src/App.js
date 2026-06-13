import { HashRouter, Routes, Route } from 'react-router-dom';
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
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/dashboard/food-diary" element={<FoodDiary />} />
        <Route path="/dashboard/meal-planner" element={<MealPlanner />} />
        <Route path="/dashboard/barcode-scanner" element={<BarcodeScanner />} />
        <Route path="/dashboard/meal-scan" element={<MealScan />} />
        <Route path="/dashboard/recipes" element={<Recipes />} />
        <Route path="/dashboard/custom-foods" element={<CustomFoods />} />
        <Route path="/dashboard/grocery-list" element={<GroceryList />} />
        <Route path="/dashboard/nutrition" element={<Nutrition />} />
        <Route path="/dashboard/diet-recommender" element={<DietRecommender />} />
        <Route path="/dashboard/goals" element={<Goals />} />
        <Route path="/dashboard/exercise" element={<Exercise />} />
        <Route path="/dashboard/workouts" element={<Workouts />} />
        <Route path="/dashboard/water" element={<Water />} />
        <Route path="/dashboard/weekly-calendar" element={<WeeklyCalendar />} />
        <Route path="/dashboard/progress" element={<Progress />} />
        <Route path="/dashboard/restaurants" element={<Restaurants />} />
        <Route path="/dashboard/friends" element={<Friends />} />
        <Route path="/dashboard/messages" element={<Messages />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/contact-messages" element={<AdminContactMessages />} />

      </Routes>
    </HashRouter>
  );
}

export default App;
