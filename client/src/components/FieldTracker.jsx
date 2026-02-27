function FieldTracker({ filledFields, missingFields, fieldLabels, formState }) {
    const allFields = [...filledFields, ...missingFields];

    return (
        <div className="dashboard-card field-tracker">
            <div className="card-header">
                <h3>Field Tracker</h3>
                <span className="field-count">{filledFields.length}/{allFields.length}</span>
            </div>
            <div className="card-content">
                <div className="field-list">
                    {allFields.map((field) => {
                        const isFilled = filledFields.includes(field);
                        return (
                            <div key={field} className={`field-item ${isFilled ? 'filled' : 'missing'}`}>
                                <div className={`field-check ${isFilled ? 'checked' : ''}`}>
                                    {isFilled ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <div className="empty-check"></div>
                                    )}
                                </div>
                                <div className="field-info">
                                    <span className="field-label">{fieldLabels[field] || field}</span>
                                    {isFilled && formState[field] && (
                                        <span className="field-value">{formState[field]}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default FieldTracker;
