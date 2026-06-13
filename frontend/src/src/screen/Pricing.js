import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Panel } from '../componenets/Ui';
import PublicLayout from '../Layouts/PublicLayout';
import '../styles/Pricing.css';

const plans = [
    ['Free', '$0', 'Daily diary, foods, water, and progress basics.'],
    ['Pro', '$12', 'Meal planning, charts, scanner workflows, recipes, and groceries.'],
    ['Coach / Premium', '$29', 'Social accountability, advanced reports, and coach-ready exports.'],
];

const tableRows = ['Food diary', 'Macro reports', 'Meal scan', 'Social accountability', 'Admin-ready exports'];

export default function Pricing() {
    useEffect(() => { document.title = 'Pricing'; }, []);

    return (
        <PublicLayout>
            <section className="pricingPage">
                <div className="pricingHeader">
                    <div>
                        <Badge tone="yellow">Monthly and yearly</Badge>
                        <h1 className="pricingTitle">Plans for every food routine.</h1>
                    </div>
                    <div className="pricingToggle">
                        <button className="toggleBtn toggleBtnActive">Monthly</button>
                        <button className="toggleBtn toggleBtnInactive">Yearly</button>
                    </div>
                </div>

                <div className="pricingPlanGrid">
                    {plans.map(([name, price, copy]) => (
                        <Panel key={name}>
                            <h2 className="planName">{name}</h2>
                            <p className="planPrice">{price}</p>
                            <p className="planDesc">{copy}</p>
                            <Link to="/register" className="planBtn">Start Free</Link>
                        </Panel>
                    ))}
                </div>

                <div className="pricingTableWrap">
                    <Panel>
                        <table className="pricingTable">
                            <thead>
                                <tr>
                                    {['Feature', 'Free', 'Pro', 'Coach'].map((head) => (
                                        <th key={head}>{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((row) => (
                                    <tr key={row}>
                                        <td>{row}</td>
                                        <td>Included</td>
                                        <td>Included</td>
                                        <td>Included</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Panel>
                </div>
            </section>
        </PublicLayout>
    );
}
