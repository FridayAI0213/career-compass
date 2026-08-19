import { contentHash, inferSeniority } from "../normalize";
import type { JobProvider, JobQuery, NormalizedJob } from "../types";

interface Template {
  fields: string[];
  company: string;
  title: string;
  location: string;
  workMode: NormalizedJob["workMode"];
  industry: string;
  salary: [number, number];
  years: number;
  degree: string | null;
  skills: string[];
  certifications: string[];
  requirements: string[];
  preferred: string[];
  description: string;
}

/**
 * Sample catalogue used ONLY while no real job source is configured. Every row
 * produced here is flagged `isDemo` and surfaced in the UI as sample data, so
 * it is never mistaken for live market data.
 */
const TEMPLATES: Template[] = [
  {
    fields: ["computer engineering", "electrical engineering", "embedded", "hardware", "firmware"],
    company: "Northlake Semiconductor",
    title: "FPGA Design Engineer",
    location: "Austin, TX",
    workMode: "onsite",
    industry: "Semiconductor",
    salary: [115000, 145000],
    years: 3,
    degree: "Bachelor",
    skills: ["Verilog", "SystemVerilog", "FPGA", "Timing Analysis", "Vivado", "Digital Design"],
    certifications: [],
    requirements: ["3+ years of RTL design experience", "Strong SystemVerilog fundamentals"],
    preferred: ["Experience with high-speed interfaces", "Exposure to formal verification"],
    description:
      "Own RTL design and implementation for high-throughput data-path blocks on Xilinx devices, from micro-architecture through timing closure and lab bring-up.",
  },
  {
    fields: ["computer engineering", "embedded", "firmware", "software"],
    company: "Vertex Avionics",
    title: "Embedded Firmware Engineer",
    location: "Denver, CO",
    workMode: "hybrid",
    industry: "Aerospace & Defense",
    salary: [105000, 132000],
    years: 2,
    degree: "Bachelor",
    skills: ["C", "C++", "RTOS", "ARM Cortex-M", "Device Drivers", "Debugging"],
    certifications: [],
    requirements: ["2+ years developing embedded C for microcontrollers", "US work authorization"],
    preferred: ["DO-178C exposure", "CAN bus experience"],
    description:
      "Develop and validate flight-adjacent firmware on ARM Cortex-M platforms, including driver development, RTOS integration and hardware bring-up with the electrical team.",
  },
  {
    fields: ["computer engineering", "hardware", "verification"],
    company: "Halcyon Silicon",
    title: "Design Verification Engineer",
    location: "Remote, US",
    workMode: "remote",
    industry: "Semiconductor",
    salary: [120000, 155000],
    years: 4,
    degree: "Bachelor",
    skills: ["UVM", "SystemVerilog", "Verification", "Python", "Scripting"],
    certifications: [],
    requirements: ["4+ years in constrained-random verification", "Deep UVM knowledge"],
    preferred: ["Coverage closure ownership", "Low-power verification"],
    description:
      "Build UVM testbenches and coverage plans for subsystem-level verification, drive regressions and debug failures alongside design owners.",
  },
  {
    fields: ["computer engineering", "robotics", "controls", "mechanical"],
    company: "Arden Robotics",
    title: "Robotics Controls Engineer",
    location: "Pittsburgh, PA",
    workMode: "onsite",
    industry: "Robotics",
    salary: [110000, 140000],
    years: 3,
    degree: "Bachelor",
    skills: ["C++", "ROS", "Control Systems", "Python", "Sensor Fusion"],
    certifications: [],
    requirements: ["Hands-on robot bring-up experience", "Strong controls fundamentals"],
    preferred: ["ROS 2 migration experience", "Real-time Linux"],
    description:
      "Design and tune motion-control loops for mobile manipulators, integrating perception outputs and validating on hardware in the field lab.",
  },
  {
    fields: ["nursing", "healthcare", "registered nurse", "clinical"],
    company: "Cedar Ridge Medical Center",
    title: "Registered Nurse — Intensive Care Unit",
    location: "Columbus, OH",
    workMode: "onsite",
    industry: "Hospital & Health Care",
    salary: [78000, 96000],
    years: 1,
    degree: "Associate",
    skills: ["Critical Care", "Ventilator Management", "Patient Assessment", "EPIC", "Telemetry"],
    certifications: ["RN License", "BLS", "ACLS"],
    requirements: ["Active RN license", "BLS and ACLS certification", "1+ year acute care experience"],
    preferred: ["CCRN certification", "Level I trauma exposure"],
    description:
      "Provide direct nursing care to critically ill adults in a 24-bed medical ICU, working within an interdisciplinary team on a 3x12 schedule.",
  },
  {
    fields: ["nursing", "healthcare", "registered nurse", "new grad"],
    company: "Saint Marin Health",
    title: "New Graduate RN Residency — Emergency Department",
    location: "Sacramento, CA",
    workMode: "onsite",
    industry: "Hospital & Health Care",
    salary: [82000, 94000],
    years: 0,
    degree: "Bachelor",
    skills: ["Triage", "Patient Assessment", "IV Therapy", "Emergency Care"],
    certifications: ["RN License", "BLS"],
    requirements: ["RN license or eligibility", "Graduation within the last 12 months"],
    preferred: ["ED tech or externship experience", "Bilingual"],
    description:
      "A 12-month structured residency pairing new graduate nurses with preceptors in a high-volume emergency department, including simulation and cohort learning.",
  },
  {
    fields: ["data", "analytics", "software", "computer science"],
    company: "Meridian Analytics",
    title: "Data Engineer",
    location: "Chicago, IL",
    workMode: "hybrid",
    industry: "Software",
    salary: [118000, 148000],
    years: 3,
    degree: "Bachelor",
    skills: ["Python", "SQL", "Airflow", "dbt", "AWS", "Data Modeling"],
    certifications: [],
    requirements: ["3+ years building production data pipelines", "Strong SQL"],
    preferred: ["Streaming experience", "Warehouse cost optimisation"],
    description:
      "Build and operate batch and streaming pipelines feeding customer-facing analytics, owning data quality and modelling standards.",
  },
  {
    fields: ["finance", "accounting", "business"],
    company: "Brightpoint Capital",
    title: "Financial Analyst",
    location: "New York, NY",
    workMode: "hybrid",
    industry: "Financial Services",
    salary: [90000, 115000],
    years: 2,
    degree: "Bachelor",
    skills: ["Financial Modeling", "Excel", "Valuation", "SQL", "Reporting"],
    certifications: [],
    requirements: ["2+ years in FP&A or investment analysis", "Advanced Excel modelling"],
    preferred: ["CFA Level I", "Python for analysis"],
    description:
      "Support portfolio reporting and diligence work, building models and variance analysis for the investment committee.",
  },
];

function score(template: Template, keywords: string[]): number {
  const hay = template.fields.join(" ");
  return keywords.reduce((total, keyword) => {
    const k = keyword.toLowerCase().trim();
    if (!k) return total;
    if (hay.includes(k)) return total + 2;
    if (template.skills.some((s) => s.toLowerCase() === k)) return total + 1;
    if (template.title.toLowerCase().includes(k)) return total + 2;
    return total;
  }, 0);
}

export const demoJobProvider: JobProvider = {
  id: "demo",
  label: "JobOS sample catalogue",
  isConfigured: () => true,
  async fetchJobs(query: JobQuery): Promise<NormalizedJob[]> {
    const ranked = TEMPLATES.map((template) => ({ template, relevance: score(template, query.keywords) }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, query.limit ?? 8);

    const now = Date.now();
    return ranked.map(({ template }, index) => {
      const job: NormalizedJob = {
        source: "demo",
        externalId: contentHash({ company: template.company, title: template.title, location: template.location }),
        company: template.company,
        title: template.title,
        description: template.description,
        location: template.location,
        locationNormalized: template.location,
        workMode: template.workMode,
        employmentType: "Full-time",
        seniority: inferSeniority(template.title, template.description),
        salaryMin: template.salary[0],
        salaryMax: template.salary[1],
        salaryCurrency: "USD",
        requirements: template.requirements,
        preferredQualifications: template.preferred,
        skills: template.skills,
        certifications: template.certifications,
        degreeRequirement: template.degree,
        minYearsExperience: template.years,
        industry: template.industry,
        postedAt: new Date(now - index * 86400000).toISOString(),
        deadlineAt: null,
        applicationUrl: null,
        sourceUrl: null,
        isDemo: true,
      };
      return job;
    });
  },
};