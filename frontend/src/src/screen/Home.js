import { Badge, Panel, ProgressBar } from '../componenets/Ui';
import PublicLayout from '../Layouts/PublicLayout';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Apple, Camera, ChefHat, Dumbbell, QrCode, Sparkles, Users } from 'lucide-react';
import '../styles/Home.css';

const features = [
    ['Calorie tracking', Apple],
    ['Food diary', ChefHat],
    ['Diet recommender', Sparkles],
    ['Barcode scanner', QrCode],
    ['Meal photo scan', Camera],
    ['Exercise tracking', Dumbbell],
    ['Social progress', Users],
];

export default function Home({ stats = [] }) {
    useEffect(() => {
        document.title = 'NutriPlan Pro';
    }, []);

    return (
        <PublicLayout>
            <section className="hero">
                <div className="heroGrid">
                    <div className="heroContent">
                        <Badge tone="teal">Nutrition SaaS dashboard</Badge>
                        <h1 className="heroTitle">NutriPlan Pro</h1>
                        <p className="heroSubtitle">
                            Plan smarter. Eat better. Track your health with confidence.
                        </p>
                        <div className="heroActions">
                            <Link to="/register" className="btnPrimary">
                                Start Free
                            </Link>
                            <Link to="/login" className="btnSecondary">
                                View Demo
                            </Link>
                        </div>
                        <div className="statsGrid">
                            {stats.map((stat) => (
                                <div key={stat.label} className="statCard">
                                    <p className="statValue">{stat.value}</p>
                                    <p className="statLabel">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="heroImageWrap">
                        <img
                            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=85"
                            alt="Colorful balanced meal ingredients"
                            className="heroImage"
                        />
                        <div className="overlayCards">
                            <Panel style={{ padding: '1rem' }}>
                                <p className="cardLabel">Calories today</p>
                                <p className="cardValue">1,420</p>
                                <ProgressBar value={76} />
                            </Panel>
                            <Panel style={{ padding: '1rem' }}>
                                <p className="cardLabel">Protein</p>
                                <p className="cardValue">98g</p>
                                <ProgressBar value={72} color="bg-sky-500" />
                            </Panel>
                            <Panel style={{ padding: '1rem' }}>
                                <p className="cardLabel">Water</p>
                                <p className="cardValue">2.1L</p>
                                <ProgressBar value={84} color="bg-amber-500" />
                            </Panel>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="featuresGrid">
                    {features.map(([title, Icon]) => (
                        <Panel key={title}>
                            <div className="featureIconBox">
                                <Icon className="featureIcon" />
                            </div>
                            <h2 className="featureTitle">{title}</h2>
                            <p className="featureDesc">
                                Premium dashboard workflows for logging, planning, scanning, and reviewing progress without clutter.
                            </p>
                        </Panel>
                    ))}
                </div>
            </section>

            <section className="whiteSection">
                <div className="whiteGrid">
                    {[
                        ['Food diary', 'Breakfast, lunch, dinner, snacks, water, exercise, diary notes, and sharing controls.'],
                        ['Recipe management', 'Custom recipes with ingredients, instructions, nutrition, images, tags, and favorites.'],
                        ['Progress tracking', 'Weight logs, charts, photos, status posts, and insights tied to real goals.'],
                    ].map(([title, text]) => (
                        <div key={title} style={{ minWidth: 0 }}>
                            <h2 className="infoTitle">{title}</h2>
                            <p className="infoText">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section">
                <div className="pricingGrid">
                    <Panel>
                        <Badge tone="orange">Pricing preview</Badge>
                        <h2 className="pricingTitle">Start free, upgrade when habits stick.</h2>
                        <p className="pricingDesc">
                            Free for daily logging, Pro for planning and analytics, Coach for premium accountability workflows.
                        </p>
                    </Panel>
                    <div className="planGrid">
                        {['Free', 'Pro', 'Coach'].map((plan, index) => (
                            <Panel key={plan}>
                                <p className="planName">{plan}</p>
                                <p className="planPrice">{index === 0 ? '$0' : index === 1 ? '$12' : '$29'}</p>
                                <p className="planPeriod">per month</p>
                            </Panel>
                        ))}
                    </div>
                </div>
            </section>

            <section className="testimonialSection">
                <div className="testimonialGrid">
                    {[
                        'The dashboard finally makes meal planning feel organized.',
                        'Barcode and custom foods cover local meals I actually eat.',
                        'The progress page keeps my weekly goal honest without pressure.',
                    ].map((quote) => (
                        <blockquote key={quote} className="testimonial">
                            {quote}
                        </blockquote>
                    ))}
                </div>
            </section>

            <section className="faqWrap">
                <h2 className="faqTitle">FAQ</h2>
                <div className="faqList">
                    {['Can I create custom foods?', 'Does meal scan use real AI?', 'Can friends view my diary?'].map((question) => (
                        <Panel key={question}>
                            <p className="faqQuestion">{question}</p>
                            <p className="faqAnswer">
                                Yes. The current build includes the full workflow and local seeded suggestions where external integrations can be connected later.
                            </p>
                        </Panel>
                    ))}
                </div>
            </section>
        </PublicLayout>
    );
}
