import React from 'react';

const About = () => {
  return (
    <section className="about" id="about">
      <div className="container">
        <h2>About Our Marketplace</h2>
        <div className="about-content">
          <div className="about-text">
            <h3>The Problem We Solve</h3>
            <p>Local farmers often struggle to reach consumers directly due to traditional supply chains dominated by middlemen. This results in reduced profits for farmers and higher prices for consumers, while compromising on freshness and quality.</p>
            
            <h3>Our Solution</h3>
            <p>FreshFarm connects farmers directly with consumers through our innovative digital marketplace. By eliminating intermediaries, we create a win-win situation for everyone involved:</p>
            <ul>
              <li><strong>Higher Profits:</strong> Farmers earn 30-40% more by selling directly</li>
              <li><strong>Lower Prices:</strong> Consumers save up to 25% on fresh produce</li>
              <li><strong>Freshness Guaranteed:</strong> Harvest-to-doorstep within 24 hours</li>
              <li><strong>Transparency:</strong> Know exactly where your food comes from</li>
              <li><strong>Sustainability:</strong> Support eco-friendly farming practices</li>
              <li><strong>Community:</strong> Build direct relationships with local farmers</li>
            </ul>
          </div>
          <div className="about-image">
            <img 
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Fresh vegetables from local farm" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
