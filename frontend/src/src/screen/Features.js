import { useEffect } from 'react';
import { Panel } from '../componenets/Ui';
import PublicLayout from '../Layouts/PublicLayout';
import '../styles/Features.css';

const features = [
    'Calorie tracking', 'Food diary', 'Barcode scanner', 'Meal photo scan', 'Weight loss/gain goals', 'Macro tracking',
    'Nutrition dashboard', 'Diet recommender', 'Recipes', 'Custom foods', 'Exercise tracking', 'Workout routines', 'Water tracking',
    'Progress photos', 'Restaurant logging', 'Health integrations', 'Friends and social features',
];

export default function Features() {
    useEffect(() => { document.title = 'Features'; }, []);

    return (
        <PublicLayout>
            <section className="featuresPage">
                <h1 className="featuresTitle">Features for daily nutrition, training, and habit clarity.</h1>
                <div className="featuresGrid">
                    {features.map((feature, index) => (
                        <Panel key={feature}>
                            <p className="featureNumber">0{(index % 9) + 1}</p>
                            <h2 className="featurePanelTitle">{feature}</h2>
                            <p className="featurePanelDesc">
                                Database-backed SaaS workflow with responsive cards, filters, empty states, and future integration points.
                            </p>
                        </Panel>
                    ))}
                </div>
            </section>
        </PublicLayout>
    );
}
