import { useEffect } from 'react';
import { Panel } from '../componenets/Ui';
import PublicLayout from '../Layouts/PublicLayout';
import '../styles/About.css';

export default function About() {
    useEffect(() => { document.title = 'About'; }, []);

    return (
        <PublicLayout>
            <section className="aboutPage">
                <div className="aboutInner">
                <div className="aboutText">
                    <h1 className="aboutTitle">Helping people build healthier food systems.</h1>
                    <p className="aboutDesc">
                        NutriPlan Pro exists to help users track nutrition, manage meals, build healthy habits, and achieve weight goals with less guesswork.
                    </p>
                </div>
                <Panel>
                    <img
                        src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85"
                        alt="Fresh meal prep bowls"
                        className="aboutImage"
                    />
                    <div className="aboutTags">
                        {['Clear data', 'Kind habits', 'Flexible planning'].map((item) => (
                            <div key={item} className="aboutTag">{item}</div>
                        ))}
                    </div>
                </Panel>
                </div>
            </section>
        </PublicLayout>
    );
}
