import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const PlanSection = () => {
  const [selectedPlan, setSelectedPlan] = useState('standard');
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      features: [
        'Basic access to tools',
        '3 requests per day',
        'Standard response time',
        'Web-based interface'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$20/month',
      features: [
        'Full access to all tools',
        '100 requests per day',
        'Faster response time',
        'API access',
        'Web-based interface'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$40/month',
      features: [
        'Unlimited access to all tools',
        'Unlimited requests',
        'Priority response time',
        'API access',
        'Web-based interface',
        'Advanced features',
        'Priority support'
      ]
    }
  ];

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h2 className="fw-bold">Choose your plan</h2>
          <p className="text-muted">Select the plan that best suits your needs</p>
        </div>
      </div>
      
      <div className="row justify-content-center">
        {plans.map((plan) => (
          <div className="col-lg-4 col-md-6 mb-4" key={plan.id}>
            <div 
              className={`card h-100 border ${selectedPlan === plan.id ? 'border-dark' : 'border-light'}`}
              onClick={() => setSelectedPlan(plan.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body d-flex flex-column">
                <div className="mb-4">
                  <h3 className="fw-bold">{plan.name}</h3>
                  <div className="d-flex align-items-baseline">
                    <h4 className="fw-bold mb-0">{plan.price}</h4>
                    {plan.id !== 'free' && <span className="text-muted ms-2">billed monthly</span>}
                  </div>
                </div>
                
                <div className="mb-4">
                  <hr className="my-3" />
                  <ul className="list-unstyled">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="mb-2">
                        <i className="bi bi-check2 me-2"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto">
                  <button 
                    className={`btn w-100 ${selectedPlan === plan.id ? 'btn-dark' : 'btn-outline-dark'}`}
                  >
                    {selectedPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanSection;