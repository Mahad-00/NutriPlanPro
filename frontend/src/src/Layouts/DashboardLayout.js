import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Utensils, Calendar, CalendarCheck, QrCode, Camera,
    BookOpen, Apple, ShoppingCart, Salad, Sparkles, Target, Dumbbell,
    Activity, Droplets, TrendingUp, Store, Users, MessageSquare,
    Settings, LogOut, Search, ChevronUp, ChevronDown, Leaf,
} from 'lucide-react';
import '../styles/DashboardLayout.css';

const NAV_ITEMS = [
    { label: 'Dashboard',        icon: LayoutDashboard },
    { label: 'Food Diary',       icon: Utensils        },
    { label: 'Meal Planner',     icon: Calendar        },
    { label: 'Weekly Calendar',  icon: CalendarCheck   },
    { label: 'Barcode Scanner',  icon: QrCode          },
    { label: 'Meal Scan',        icon: Camera          },
    { label: 'Recipes',          icon: BookOpen        },
    { label: 'Custom Foods',     icon: Apple           },
    { label: 'Grocery List',     icon: ShoppingCart    },
    { label: 'Nutrition',        icon: Salad           },
    { label: 'Diet Recommender', icon: Sparkles        },
    { label: 'Goals',            icon: Target          },
    { label: 'Exercise',         icon: Dumbbell        },
    { label: 'Workouts',         icon: Activity        },
    { label: 'Water',            icon: Droplets        },
    { label: 'Progress',         icon: TrendingUp      },
    { label: 'Restaurants',      icon: Store           },
    { label: 'Friends',          icon: Users           },
    { label: 'Messages',         icon: MessageSquare   },
    { label: 'Settings',         icon: Settings        },
    { label: 'Logout',           icon: LogOut          },
];

const linkPath = (label) => {
    if (label === 'Dashboard') return '/dashboard';
    if (label === 'Logout')    return '/';
    return '/dashboard/' + label.toLowerCase().replace(/\s+/g, '-');
};

// Format today's date as M/D/YYYY
const todayStr = () => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export default function DashboardLayout({ children }) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const navRef    = useRef(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userName, setUserName] = useState('User');
    const [userInitial, setUserInitial] = useState('U');

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const name = u.name || 'User';
            setUserName(name);
            setUserInitial(name.charAt(0).toUpperCase());
        } catch {
            setUserName('User');
            setUserInitial('U');
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const scrollNav = (dir) => {
        if (navRef.current) navRef.current.scrollBy({ top: dir * 80, behavior: 'smooth' });
    };

    return (
        <div className="dashLayout">

            {/* ── Top bar ── */}
            <header className="dashTopBar">

                {/* Logo block — same width as sidebar */}
                <Link to="/dashboard" className="dashTopLogo">
                    <div className="dashLogoIcon">
                        <Leaf size={18} color="#fff" />
                    </div>
                    <div className="dashLogoText">
                        <span className="dashLogoName">NutriPlan Pro</span>
                        <span className="dashLogoTagline">Plan smarter. Eat better.</span>
                    </div>
                </Link>

                {/* Search bar — centre */}
                <div className="dashTopSearch">
                    <div className="dashSearchWrap">
                        <Search size={14} className="dashSearchIcon" />
                        <input
                            type="text"
                            className="dashSearchInput"
                            placeholder="Search foods, recipes, restaurants, exercises"
                        />
                    </div>
                </div>

                {/* User info + avatar — right */}
                <div className="dashTopRight">
                    <div className="dashUserInfo">
                        <span className="dashUserName">{userName}</span>
                        <span className="dashUserDate">{todayStr()}</span>
                    </div>
                    <div className="dashAvatar">{userInitial}</div>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="dashBody">

                {/* Sidebar */}
                <aside className={`dashSidebar${mobileOpen ? ' dashSidebarOpen' : ''}`}>
                    <nav className="dashSideNav" ref={navRef}>
                        {NAV_ITEMS.map(({ label, icon: Icon }) => (
                            <Link
                                key={label}
                                to={linkPath(label)}
                                className={`dashSideLink${location.pathname === linkPath(label) ? ' dashSideLinkActive' : ''}`}
                                onClick={label === 'Logout' ? handleLogout : () => setMobileOpen(false)}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Mobile overlay */}
                {mobileOpen && (
                    <div className="dashOverlay" onClick={() => setMobileOpen(false)} />
                )}

                {/* Page content */}
                <main className="dashContent">
                    {children}
                </main>
            </div>
        </div>
    );
}