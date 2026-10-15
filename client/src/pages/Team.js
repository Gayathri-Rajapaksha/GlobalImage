import React from 'react';
import './About.css';

const team = [
  {
    name: 'U.Malshika',
    title: 'Founder & Lead Photographer',
    desc: 'Over 15 years of experience in event and corporate photography. Specializes in corporate events and professional headshots.',
    photo: '/team1.jpg'
  },
  {
    name: 'D.gamage',
    title: 'Senior Photographer',
    desc: 'Specializes in concert photography and dynamic event coverage.',
    photo: '/team2.jpg'
  },
  {
    name: 'R.liyange',
    title: 'Senior Photographer',
    desc: 'Expert in graduation ceremonies and large group event coverage.',
    photo: '/team3.jpg'
  },
  {
    name: 'S.Dilki',
    title: 'Photographer & Editor',
    desc: 'Specializes in corporate events photography.',
    photo: '/team4.jpg'
  },
  // Add more staff as needed
  {
    name: 'A.Perera',
    title: 'Photographer',
    desc: 'Experienced in wedding and family event photography.',
    photo: '/team5.jpg'
  },
  {
    name: 'K.Silva',
    title: 'Editor',
    desc: 'Expert in post-production and photo editing.',
    photo: '/team6.jpg'
  },
  {
    name: 'N.Jayasinghe',
    title: 'Assistant Photographer',
    desc: 'Supports event shoots and equipment setup.',
    photo: '/team7.jpg'
  },
  {
    name: 'T.Fernando',
    title: 'Photographer',
    desc: 'Specializes in outdoor and nature photography.',
    photo: '/team8.jpg'
  }
];

const Team = () => (
  <div className="about-bg">
    <div className="about-container">
      <h1 className="about-title">Meet Our Team</h1>
      <div className="about-divider" />
      <div className="about-team-grid">
        {team.map(member => (
          <div className="about-team-card" key={member.name}>
            <img src={member.photo} alt={member.name} className="about-team-photo" />
            <div className="about-team-name">{member.name}</div>
            <div className="about-team-title">{member.title}</div>
            <div className="about-team-desc">{member.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Team; 