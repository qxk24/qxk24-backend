/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module : University Knowledge Map Generator
 * Platform : Node.js
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Complete founder university knowledge map (5 majors, 38 primary disciplines, 400+ subfields). */
const MAP = {
  "majors": [
    {
      "id": "humanities",
      "name": "Humanities",
      "disciplines": [
        {
          "id": "1.1",
          "name": "Performing Arts",
          "subfields": [
            "Performing Arts**",
            "Music — Composition",
            "Music — Conducting",
            "Music — Jazz Studies",
            "Music — Music Education",
            "Music — Music Theory",
            "Music — Musicology",
            "Music — Ethnomusicology",
            "Music — Recording",
            "Dance — Choreography",
            "Dance — Dance Notation",
            "Dance — Ethnochoreology",
            "Theatre — Acting",
            "Theatre — Directing",
            "Theatre — Dramaturgy",
            "Theatre — Musical Theatre",
            "Theatre — Playwrighting",
            "Theatre — Scenography",
            "Theatre — Stage Design",
            "Film Studies — Animation",
            "Film Studies — Film Criticism",
            "Film Studies — Filmmaking",
            "Film Studies — Film Theory",
            "Oral Literature — Public Speaking",
            "Oral Literature — Storytelling",
            "Oral Literature — Spoken Word",
            "Game Studies (Video Game Design, Audio Game Design)."
          ]
        },
        {
          "id": "1.2",
          "name": "Visual Arts",
          "subfields": [
            "Fine Arts — Drawing",
            "Fine Arts — Painting",
            "Fine Arts — Photography",
            "Fine Arts — Sculpture",
            "Fine Arts — Printmaking",
            "Fine Arts — Studio Art",
            "Applied Arts",
            "Architecture — Interior Architecture",
            "Architecture — Landscape Architecture",
            "Architecture — Historic Preservation",
            "Architecture — Technical Drawing",
            "Graphic Design",
            "Digital Art",
            "Fashion Design",
            "Textile Arts",
            "Calligraphy",
            "Craft",
            "Decorative Arts",
            "Mixed Media",
            "Culinary Arts (Cooking, Gastronomy, Food Safety, Food Studies, Food Preparation)."
          ]
        },
        {
          "id": "1.3",
          "name": "History",
          "subfields": [
            "Prehistory",
            "Ancient History — Egypt",
            "Ancient History — Greece",
            "Ancient History — Rome",
            "Ancient History — China",
            "Ancient History — Mesopotamia",
            "Ancient History — Indus Valley",
            "Medieval History",
            "Modern History",
            "Asian History — Chinese",
            "Asian History — Japanese",
            "Asian History — Korean",
            "Asian History — Indian",
            "Asian History — Indonesian",
            "Asian History — Vietnamese",
            "Asian History — Philippine",
            "European History — British",
            "European History — French",
            "European History — German",
            "European History — Italian",
            "European History — Spanish",
            "European History — Russian",
            "African History",
            "American History — North",
            "American History — South",
            "American History — Latin",
            "Art History",
            "Cultural History",
            "Economic History",
            "Environmental History",
            "Intellectual History",
            "Political History",
            "Scientific History",
            "Technological History",
            "World History."
          ]
        },
        {
          "id": "1.4",
          "name": "Languages & Literature",
          "subfields": [
            "Classics",
            "Comparative Literature",
            "Creative Writing — Poetry",
            "Creative Writing — Fiction",
            "Creative Writing — Non-fiction",
            "Creative Writing — Screenwriting",
            "English Studies",
            "English Literature",
            "Literary Theory — Critical Theory",
            "Literary Theory — Literary Criticism",
            "Literary Theory — Rhetoric",
            "Literary Theory — Poetics",
            "Languages — Classical Languages",
            "Languages — Modern Languages",
            "World Literature — American",
            "World Literature — British",
            "World Literature — Canadian",
            "World Literature — Irish",
            "World Literature — African",
            "World Literature — South Asian",
            "Comics Studies",
            "History of Literature."
          ]
        },
        {
          "id": "1.5",
          "name": "Philosophy",
          "subfields": [
            "Aesthetics",
            "Philosophy of Economics",
            "Philosophy of Education",
            "Philosophy of Engineering",
            "Philosophy of Language",
            "Philosophy of Law",
            "Philosophy of Mathematics",
            "Philosophy of Religion",
            "Philosophy of Science",
            "Philosophy of Technology",
            "Epistemology",
            "Ethics — Applied Ethics",
            "Ethics — Bioethics",
            "Ethics — Environmental Ethics",
            "Ethics — Normative Ethics",
            "Ethics — Virtue Ethics",
            "Logic — Mathematical Logic",
            "Logic — Philosophical Logic",
            "Metaphysics — Ontology",
            "Metaphysics — Philosophy of Mind",
            "Metaphysics — Free Will",
            "Political Philosophy — Anarchism",
            "Political Philosophy — Libertarianism",
            "Political Philosophy — Marxism",
            "Philosophy of Artificial Intelligence."
          ]
        },
        {
          "id": "1.6",
          "name": "Religion & Theology",
          "subfields": [
            "Comparative Religion",
            "Christian Theology",
            "Islamic Studies",
            "Jewish Studies",
            "Buddhist Studies",
            "Hindu Studies",
            "Religious Philosophy",
            "Ecclesiastical History.",
            "---",
            "**2. SOCIAL SCIENCES**",
            "The study of human society",
            "behaviour",
            "and institutions."
          ]
        }
      ]
    },
    {
      "id": "social-sciences",
      "name": "Social Sciences",
      "disciplines": [
        {
          "id": "2.1",
          "name": "Anthropology",
          "subfields": [
            "Archaeology — Classical Archaeology",
            "Archaeology — Archaeometry",
            "Archaeology — Maritime Archaeology",
            "Cultural Anthropology",
            "Biological Anthropology",
            "Linguistic Anthropology",
            "Social Anthropology",
            "Ethnography",
            "Folklore."
          ]
        },
        {
          "id": "2.2",
          "name": "Economics",
          "subfields": [
            "Microeconomics",
            "Macroeconomics",
            "Econometrics",
            "Development Economics",
            "Behavioural Economics",
            "International Economics",
            "Public Economics",
            "Labour Economics",
            "Environmental Economics",
            "Financial Economics",
            "Health Economics",
            "Islamic Economics."
          ]
        },
        {
          "id": "2.3",
          "name": "Geography",
          "subfields": [
            "Physical Geography — Geomorphology",
            "Physical Geography — Climatology",
            "Physical Geography — Hydrology",
            "Physical Geography — Biogeography",
            "Physical Geography — Oceanography",
            "Human Geography — Cultural Geography",
            "Human Geography — Political Geography",
            "Human Geography — Urban Geography",
            "Human Geography — Economic Geography",
            "Cartography",
            "Geographic Information Systems — GIS",
            "Environmental Geography."
          ]
        },
        {
          "id": "2.4",
          "name": "Political Science",
          "subfields": [
            "Political Theory",
            "Comparative Politics",
            "International Relations",
            "Public Administration",
            "Public Policy",
            "Political Economy",
            "Geopolitics",
            "Diplomacy",
            "Governance Studies."
          ]
        },
        {
          "id": "2.5",
          "name": "Psychology",
          "subfields": [
            "Abnormal Psychology",
            "Behavioural Psychology",
            "Clinical Psychology",
            "Cognitive Psychology",
            "Counselling Psychology",
            "Developmental Psychology",
            "Educational Psychology",
            "Forensic Psychology",
            "Health Psychology",
            "Industrial-Organisational Psychology",
            "Neuropsychology",
            "Social Psychology",
            "Sports Psychology."
          ]
        },
        {
          "id": "2.6",
          "name": "Sociology",
          "subfields": [
            "Social Theory",
            "Criminology",
            "Demography",
            "Gender Studies",
            "Race & Ethnic Studies",
            "Urban Sociology",
            "Rural Sociology",
            "Sociology of Education",
            "Sociology of Religion",
            "Medical Sociology",
            "Environmental Sociology."
          ]
        },
        {
          "id": "2.7",
          "name": "Linguistics",
          "subfields": [
            "Applied Linguistics",
            "Cognitive Linguistics",
            "Computational Linguistics",
            "Historical Linguistics",
            "Phonetics",
            "Phonology",
            "Morphology",
            "Syntax",
            "Semantics",
            "Pragmatics",
            "Sociolinguistics",
            "Psycholinguistics",
            "Translation Studies",
            "TESL/TESOL."
          ]
        },
        {
          "id": "2.8",
          "name": "Communication & Media Studies",
          "subfields": [
            "Journalism",
            "Broadcasting",
            "Public Relations",
            "Advertising",
            "Digital Media",
            "Film Studies",
            "Media Theory",
            "Intercultural Communication",
            "Health Communication",
            "Political Communication."
          ]
        },
        {
          "id": "2.9",
          "name": "Law",
          "subfields": [
            "Constitutional Law",
            "Criminal Law — Criminal Procedure",
            "Criminal Law — Criminal Justice",
            "Criminal Law — Forensic Science",
            "Criminal Law — Police Science",
            "Civil Law — Contract Law",
            "Civil Law — Property Law",
            "Civil Law — Tort Law",
            "Civil Law — Family Law",
            "Civil Law — Labor Law",
            "Civil Law — Environmental Law",
            "Civil Law — Tax Law",
            "Civil Law — International Law",
            "Civil Law — Admiralty Law",
            "Corporate Law",
            "Islamic Law — Syariah",
            "Jewish Law",
            "Canon Law",
            "Comparative Law",
            "Jurisprudence",
            "Intellectual Property Law",
            "Cybersecurity Law.",
            "---",
            "**3. NATURAL SCIENCES**",
            "The study of the physical and natural world."
          ]
        }
      ]
    },
    {
      "id": "natural-sciences",
      "name": "Natural Sciences",
      "disciplines": [
        {
          "id": "3.1",
          "name": "Physics",
          "subfields": [
            "Classical Mechanics",
            "Electromagnetism",
            "Thermodynamics",
            "Quantum Mechanics",
            "Relativity",
            "Optics",
            "Nuclear Physics",
            "Particle Physics",
            "Astrophysics",
            "Cosmology",
            "Condensed Matter Physics",
            "Geophysics",
            "Atmospheric Physics",
            "Biophysics",
            "Computational Physics."
          ]
        },
        {
          "id": "3.2",
          "name": "Chemistry",
          "subfields": [
            "Organic Chemistry",
            "Inorganic Chemistry",
            "Physical Chemistry",
            "Analytical Chemistry",
            "Biochemistry",
            "Environmental Chemistry",
            "Polymer Chemistry",
            "Medicinal Chemistry",
            "Computational Chemistry",
            "Industrial Chemistry",
            "Nuclear Chemistry",
            "Electrochemistry."
          ]
        },
        {
          "id": "3.3",
          "name": "Biology",
          "subfields": [
            "Molecular Biology",
            "Cell Biology",
            "Genetics",
            "Genomics",
            "Ecology",
            "Evolutionary Biology",
            "Microbiology",
            "Botany",
            "Zoology",
            "Anatomy",
            "Physiology",
            "Neuroscience",
            "Marine Biology",
            "Parasitology",
            "Virology",
            "Immunology",
            "Developmental Biology",
            "Bioinformatics",
            "Astrobiology."
          ]
        },
        {
          "id": "3.4",
          "name": "Earth Sciences",
          "subfields": [
            "Geology",
            "Geochemistry",
            "Geophysics",
            "Mineralogy",
            "Petrology",
            "Sedimentology",
            "Hydrology",
            "Volcanology",
            "Seismology",
            "Glaciology",
            "Oceanography",
            "Atmospheric Science",
            "Climatology",
            "Palaeontology",
            "Soil Science."
          ]
        },
        {
          "id": "3.5",
          "name": "Astronomy & Space Science",
          "subfields": [
            "Observational Astronomy",
            "Astrophysics",
            "Cosmology",
            "Planetary Science",
            "Astrobiology",
            "Space Exploration",
            "Stellar Physics",
            "Galactic Astronomy."
          ]
        },
        {
          "id": "3.6",
          "name": "Environmental Science",
          "subfields": [
            "Environmental Chemistry",
            "Environmental Biology",
            "Conservation Biology",
            "Environmental Policy",
            "Sustainability Science",
            "Climate Change Studies",
            "Pollution Studies",
            "Natural Resource Management.",
            "---",
            "**4. FORMAL SCIENCES**",
            "The study of formal systems",
            "logic",
            "and abstract structures."
          ]
        }
      ]
    },
    {
      "id": "formal-sciences",
      "name": "Formal Sciences",
      "disciplines": [
        {
          "id": "4.1",
          "name": "Mathematics",
          "subfields": [
            "Pure Mathematics — Algebra",
            "Pure Mathematics — Analysis",
            "Pure Mathematics — Geometry",
            "Pure Mathematics — Topology",
            "Pure Mathematics — Number Theory",
            "Pure Mathematics — Combinatorics",
            "Pure Mathematics — Set Theory",
            "Applied Mathematics — Differential Equations",
            "Applied Mathematics — Numerical Analysis",
            "Applied Mathematics — Mathematical Modelling",
            "Applied Mathematics — Optimisation",
            "Statistics — Probability Theory",
            "Statistics — Statistical Inference",
            "Statistics — Bayesian Statistics",
            "Statistics — Applied Statistics",
            "Statistics — Biostatistics",
            "Discrete Mathematics",
            "Logic",
            "Graph Theory",
            "Linear Algebra",
            "Calculus."
          ]
        },
        {
          "id": "4.2",
          "name": "Computer Science",
          "subfields": [
            "Algorithms & Data Structures",
            "Programming Languages",
            "Software Engineering",
            "Operating Systems",
            "Computer Architecture",
            "Networking",
            "Databases",
            "Artificial Intelligence",
            "Machine Learning",
            "Computer Graphics",
            "Human-Computer Interaction",
            "Cybersecurity",
            "Parallel & Distributed Computing",
            "Theory of Computation",
            "Bioinformatics",
            "Information Theory."
          ]
        },
        {
          "id": "4.3",
          "name": "Information Systems",
          "subfields": [
            "Systems Analysis & Design",
            "Enterprise Systems",
            "Business Intelligence",
            "Knowledge Management",
            "IT Governance",
            "E-Commerce Systems",
            "Health Informatics",
            "Geographic Information Systems."
          ]
        },
        {
          "id": "4.4",
          "name": "Data Science & Artificial Intelligence",
          "subfields": [
            "*(emerging standalone field)*",
            "Data Mining",
            "Big Data Analytics",
            "Machine Learning",
            "Deep Learning",
            "Natural Language Processing",
            "Computer Vision",
            "Robotics",
            "Decision Science",
            "Computational Statistics",
            "AI Ethics."
          ]
        },
        {
          "id": "4.5",
          "name": "Cognitive Science",
          "subfields": [
            "Cognitive Psychology",
            "Neuroscience",
            "Linguistics",
            "Philosophy of Mind",
            "AI & Cognitive Modelling",
            "Perception Studies.",
            "---",
            "**5. APPLIED SCIENCES & PROFESSIONAL FIELDS**",
            "Knowledge applied directly to real-world professions."
          ]
        }
      ]
    },
    {
      "id": "applied-sciences",
      "name": "Applied Sciences & Professional Fields",
      "disciplines": [
        {
          "id": "5.1",
          "name": "Agriculture & Veterinary Medicine",
          "subfields": [
            "Agronomy",
            "Soil Science",
            "Plant Science",
            "Horticulture",
            "Crop Science",
            "Animal Science",
            "Aquaculture",
            "Fisheries",
            "Forestry",
            "Agricultural Economics",
            "Food Science & Technology",
            "Plantation Management",
            "Veterinary Medicine",
            "Poultry Science",
            "Dairy Science",
            "Agricultural Engineering",
            "Agroforestry",
            "Rural Development."
          ]
        },
        {
          "id": "5.2",
          "name": "Architecture & Built Environment",
          "subfields": [
            "Architecture",
            "Interior Architecture",
            "Landscape Architecture",
            "Urban Planning",
            "Town & Country Planning",
            "Quantity Surveying",
            "Construction Management",
            "Building Technology",
            "Real Estate Management",
            "Facility Management",
            "Structural Engineering (overlap with Civil)."
          ]
        },
        {
          "id": "5.3",
          "name": "Business & Management",
          "subfields": [
            "Accounting — Financial Accounting",
            "Accounting — Management Accounting",
            "Accounting — Auditing",
            "Accounting — Taxation",
            "Finance — Corporate Finance",
            "Finance — Investment",
            "Finance — Banking",
            "Finance — Insurance",
            "Finance — Islamic Finance",
            "Marketing — Consumer Behaviour",
            "Marketing — Digital Marketing",
            "Marketing — Branding",
            "Marketing — Market Research",
            "Human Resource Management — Recruitment",
            "Human Resource Management — Training & Development",
            "Human Resource Management — Industrial Relations",
            "Human Resource Management — Organisational Behaviour",
            "Entrepreneurship",
            "Business Administration",
            "International Business",
            "Supply Chain & Logistics",
            "Operations Management",
            "Strategic Management",
            "Project Management",
            "Retail Management."
          ]
        },
        {
          "id": "5.4",
          "name": "Education",
          "subfields": [
            "Early Childhood Education",
            "Primary Education",
            "Secondary Education",
            "Special Needs Education",
            "Adult Education",
            "Distance Learning",
            "Educational Psychology",
            "Curriculum Design & Development",
            "Educational Technology",
            "TESL/TESOL",
            "Physical Education",
            "Vocational Education",
            "Educational Leadership & Administration."
          ]
        },
        {
          "id": "5.5",
          "name": "Engineering & Technology",
          "subfields": [
            "Chemical Engineering — Process Engineering",
            "Chemical Engineering — Petrochemical Engineering",
            "Chemical Engineering — Polymer Engineering",
            "Chemical Engineering — Biochemical Engineering",
            "Chemical Engineering — Environmental Engineering",
            "Civil Engineering — Structural Engineering",
            "Civil Engineering — Geotechnical Engineering",
            "Civil Engineering — Transportation Engineering",
            "Civil Engineering — Water Resources Engineering",
            "Civil Engineering — Environmental Engineering",
            "Civil Engineering — Construction Engineering",
            "Electrical Engineering — Power Systems",
            "Electrical Engineering — Electronics",
            "Electrical Engineering — Signal Processing",
            "Electrical Engineering — Control Systems",
            "Electrical Engineering — Telecommunications",
            "Electrical Engineering — Microelectronics",
            "Electrical Engineering — Photonics",
            "Mechanical Engineering — Thermodynamics",
            "Mechanical Engineering — Fluid Mechanics",
            "Mechanical Engineering — Manufacturing Engineering",
            "Mechanical Engineering — Robotics",
            "Mechanical Engineering — Automotive Engineering",
            "Mechanical Engineering — Aerospace Engineering",
            "Mechanical Engineering — HVAC",
            "Mechanical Engineering — Materials Science",
            "Software Engineering — Software Architecture",
            "Software Engineering — Software Testing",
            "Software Engineering — DevOps",
            "Software Engineering — Embedded Systems",
            "Software Engineering — Mobile Development",
            "Software Engineering — Game Development",
            "Computer Engineering — Digital Systems",
            "Computer Engineering — VLSI Design",
            "Computer Engineering — Embedded Systems",
            "Computer Engineering — Computer Networks",
            "Computer Engineering — Hardware Architecture",
            "Biomedical Engineering — Medical Devices",
            "Biomedical Engineering — Biomechanics",
            "Biomedical Engineering — Tissue Engineering",
            "Biomedical Engineering — Clinical Engineering",
            "Biomedical Engineering — Neural Engineering",
            "Aerospace Engineering — Aeronautics",
            "Aerospace Engineering — Astronautics",
            "Aerospace Engineering — Propulsion",
            "Aerospace Engineering — Avionics",
            "Aerospace Engineering — Spacecraft Design",
            "Industrial Engineering — Operations Research",
            "Industrial Engineering — Ergonomics",
            "Industrial Engineering — Quality Engineering",
            "Industrial Engineering — Manufacturing Systems",
            "Industrial Engineering — Systems Engineering",
            "Materials Science & Engineering — Metallurgy",
            "Materials Science & Engineering — Ceramics",
            "Materials Science & Engineering — Polymers",
            "Materials Science & Engineering — Nanomaterials",
            "Materials Science & Engineering — Semiconductor Materials",
            "Environmental Engineering — Waste Management",
            "Environmental Engineering — Water Treatment",
            "Environmental Engineering — Air Pollution Control",
            "Environmental Engineering — Environmental Impact Assessment",
            "Nuclear Engineering — Reactor Design",
            "Nuclear Engineering — Radiation Safety",
            "Nuclear Engineering — Nuclear Medicine Applications",
            "Petroleum Engineering — Reservoir Engineering",
            "Petroleum Engineering — Drilling Engineering",
            "Petroleum Engineering — Production Engineering",
            "Marine Engineering — Naval Architecture",
            "Marine Engineering — Ocean Engineering",
            "Marine Engineering — Ship Design",
            "Mechatronics — Robotics",
            "Mechatronics — Control Systems",
            "Mechatronics — Sensors & Actuators",
            "Mechatronics — Automation",
            "Telecommunications Engineering — Wireless Networks",
            "Telecommunications Engineering — Satellite Communications",
            "Telecommunications Engineering — Optical Fibre",
            "Telecommunications Engineering — 5G/6G"
          ]
        },
        {
          "id": "5.6",
          "name": "Health Sciences & Medicine",
          "subfields": [
            "Medicine (MBBS) — Anatomy",
            "Medicine (MBBS) — Physiology",
            "Medicine (MBBS) — Biochemistry",
            "Medicine (MBBS) — Pathology",
            "Medicine (MBBS) — Pharmacology",
            "Medicine (MBBS) — Microbiology",
            "Medicine (MBBS) — Internal Medicine",
            "Medicine (MBBS) — Surgery",
            "Medicine (MBBS) — Obstetrics & Gynaecology",
            "Medicine (MBBS) — Paediatrics",
            "Medicine (MBBS) — Psychiatry",
            "Medicine (MBBS) — Neurology",
            "Medicine (MBBS) — Cardiology",
            "Medicine (MBBS) — Oncology",
            "Medicine (MBBS) — Radiology",
            "Medicine (MBBS) — Emergency Medicine",
            "Dentistry — Oral Surgery",
            "Dentistry — Orthodontics",
            "Dentistry — Periodontics",
            "Dentistry — Prosthodontics",
            "Dentistry — Paediatric Dentistry",
            "Dentistry — Oral Pathology",
            "Pharmacy — Pharmaceutical Chemistry",
            "Pharmacy — Pharmacology",
            "Pharmacy — Clinical Pharmacy",
            "Pharmacy — Pharmaceutical Technology",
            "Pharmacy — Toxicology",
            "Nursing — Clinical Nursing",
            "Nursing — Community Health Nursing",
            "Nursing — Paediatric Nursing",
            "Nursing — Mental Health Nursing",
            "Nursing — Midwifery",
            "Public Health — Epidemiology",
            "Public Health — Health Promotion",
            "Public Health — Biostatistics",
            "Public Health — Environmental Health",
            "Public Health — Occupational Health",
            "Public Health — Health Policy",
            "Allied Health — Physiotherapy",
            "Allied Health — Occupational Therapy",
            "Allied Health — Radiography",
            "Allied Health — Medical Laboratory Science",
            "Allied Health — Dietetics & Nutrition",
            "Allied Health — Audiology",
            "Allied Health — Speech-Language Pathology",
            "Allied Health — Optometry",
            "Allied Health — Podiatry",
            "Traditional & Complementary Medicine — Herbal Medicine",
            "Traditional & Complementary Medicine — Acupuncture",
            "Traditional & Complementary Medicine — Traditional Malay Medicine"
          ]
        },
        {
          "id": "5.7",
          "name": "Hospitality & Tourism",
          "subfields": [
            "Hotel & Resort Management",
            "Tourism Management",
            "Culinary Arts",
            "Event Management",
            "Aviation & Airport Management",
            "Travel & Tour Operations",
            "MICE — Meetings",
            "MICE — Incentives",
            "MICE — Conferences",
            "MICE — Exhibitions",
            "Ecotourism",
            "Heritage Tourism."
          ]
        },
        {
          "id": "5.8",
          "name": "Islamic & Religious Studies",
          "subfields": [
            "*(particularly relevant in Malaysia)*",
            "Quran & Hadith Studies — Ulumul Quran",
            "Quran & Hadith Studies — Ulumul Hadith",
            "Quran & Hadith Studies — Tafsir",
            "Quran & Hadith Studies — Qiraat",
            "Fiqh & Usul al-Fiqh — Jurisprudence",
            "Fiqh & Usul al-Fiqh — Principles of Islamic Law",
            "Aqidah & Kalam — Islamic Theology",
            "Dakwah & Islamic Communication",
            "Islamic History & Civilisation",
            "Islamic Philosophy",
            "Islamic Finance & Banking",
            "Syariah Law",
            "Comparative Religion",
            "Islamic Education",
            "Arabic Language & Literature."
          ]
        },
        {
          "id": "5.9",
          "name": "Social Work & Community Development",
          "subfields": [
            "Social Work Practice",
            "Community Development",
            "Child Welfare",
            "Gerontology",
            "Disability Studies",
            "Poverty & Welfare Policy",
            "NGO Management",
            "Counselling."
          ]
        },
        {
          "id": "5.10",
          "name": "Sports & Exercise Science",
          "subfields": [
            "Exercise Physiology",
            "Sports Coaching",
            "Biomechanics",
            "Sports Psychology",
            "Sports Nutrition",
            "Sports Management",
            "Recreation Management",
            "Physical Education."
          ]
        },
        {
          "id": "5.11",
          "name": "Defence & Security Studies",
          "subfields": [
            "Military Science",
            "Intelligence Studies",
            "Homeland Security",
            "Disaster Management",
            "Strategic Studies",
            "Police Science",
            "Forensic Science",
            "Criminology."
          ]
        },
        {
          "id": "5.12",
          "name": "Interdisciplinary & Emerging Fields",
          "subfields": [
            "Sustainability Studies",
            "Bioethics",
            "Digital Humanities",
            "Science & Technology Studies — STS",
            "Gender Studies",
            "Urban Studies",
            "Global Studies",
            "Peace & Conflict Studies",
            "Development Studies",
            "Innovation & Technology Management",
            "Quantum Computing",
            "Nanotechnology",
            "Synthetic Biology."
          ]
        }
      ]
    }
  ]
};

function slugify(subfield) {
  const s = subfield
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
  return s || "topic";
}

const topics = [];
for (const major of MAP.majors) {
  for (const discipline of major.disciplines) {
    for (const subfield of discipline.subfields) {
      const slug = slugify(subfield);
      topics.push({
        topicId: `${discipline.id}-${slug}`,
        majorId: major.id,
        majorName: major.name,
        disciplineId: discipline.id,
        disciplineName: discipline.name,
        subfield,
        label: `${major.name} › ${discipline.name} › ${subfield}`,
      });
    }
  }
}

const outDir = join(__dirname, "..", "data");
mkdirSync(outDir, { recursive: true });
const payload = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  topicCount: topics.length,
  topics,
};
const outFile = join(outDir, "university-knowledge-map.json");
writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(payload.topicCount);
