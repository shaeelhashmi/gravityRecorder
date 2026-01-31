import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompetitorData } from '../../services/ComparisonService';
import './ComparisonPage.css';

const ComparisonPage = () => {
    const params = useParams();
    const navigate = useNavigate();

    // Extract competitor name from "loom-alternative" style path
    const competitorSlugSpec = Object.keys(params)[0]; // React Router v7 param key
    const fullSlug = params[competitorSlugSpec];
    const competitorName = fullSlug.split('-')[0];

    const data = getCompetitorData(competitorName);

    useEffect(() => {
        if (data) {
            document.title = `${data.name} Alternative | Gravity Recorder`;
        }
    }, [data]);

    if (!data) {
        return <div className="comparison-container"><h1>Competitor Not Found</h1></div>;
    }

    return (
        <div className="comparison-container">
            <header className="comparison-header">
                <h1>{data.tagline}</h1>
                <p>{data.description}</p>
            </header>

            <div className="comparison-table-wrapper">
                <table className="comparison-table">
                    <thead>
                        <tr>
                            <th className="feature-col">Feature</th>
                            <th className="competitor-col">{data.name}</th>
                            <th className="gravity-col">Gravity Recorder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.comparison.map((row, index) => (
                            <tr key={index} className={row.highlight ? 'highlight-row' : ''}>
                                <td className="feature-col">{row.feature}</td>
                                <td className="competitor-col">{row.competitor}</td>
                                <td className="gravity-col">
                                    <span className="badge-gravity">{row.gravity}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <section className="comparison-footer">
                <h2>Ready to experience the difference?</h2>
                <p>Join thousands of creators who have chosen privacy and performance.</p>
                <button className="btn btn-primary" onClick={() => navigate('/recorder')}>
                    Launch Gravity Studio
                </button>
            </section>
        </div>
    );
};

export default ComparisonPage;
