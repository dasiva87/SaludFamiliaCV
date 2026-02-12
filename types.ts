
export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  birthDate: string;
  age: number;
  sex: 'M' | 'F';
  eapb: string;
  civilStatus: string;
  role: 'CF' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';
}

export interface HealthMatrix {
  [condition: string]: { [member: string]: boolean | string | number };
}

export interface FamilyRecord {
  id: string;
  createdAt: string;
  
  // 1. Datos Generales
  generalData: {
    date: string;
    department: string;
    municipality: string;
    sisben: string;
    area: 'Rural' | 'Urbana' | '';
    estrato: string;
    ethnicity: string;
  };

  // 2. Información del Grupo Familiar
  familyInfo: {
    headLastName1: string;
    headLastName2: string;
    address: string;
    neighborhood: string;
    phone: string;
    members: FamilyMember[];
    familyType: string;
    religion: string;
  };

  // 3. Antecedentes
  medicalHistory: HealthMatrix;
  obGynHistory: HealthMatrix;
  vaccinationHistory: HealthMatrix;
  surgicalHistory: HealthMatrix;
  congenitalHistory: HealthMatrix;

  // 4. Discapacidades
  disabilities: HealthMatrix;

  // 5. Hábitos y Riesgos
  habits: HealthMatrix;
  environmentalRisks: HealthMatrix;

  // 6. Factor Psicológico
  psychologicalFactors: { [key: number]: boolean | string };

  // 7. Socioeconómico
  socioeconomic: {
    housingType: string;
    housingMaterial: string;
    peoplePerRoom: number;
    roomsCount: number;
    tenure: string;
    housingStatus: string;
  };

  // 8. Vivienda y Servicios
  housingConditions: {
    wallMaterial: string;
    roofMaterial: string;
    floorMaterial: string;
    specificKitchen: boolean;
    indoorKitchen: boolean;
    gasCooking: boolean;
    overcrowding: boolean;
    smokeIndoor: boolean;
    humidityIndoor: boolean;
    electricity: boolean;
    sufficientLight: boolean;
    sufficientVentilation: boolean;
    water24h: boolean;
    waterTreated: boolean;
    petsIndoor: boolean;
    pestControl: boolean;
    publicServices: { [key: string]: boolean };
  };

  // 9. Ocupación
  occupation: {
    economicActivity: string;
    monthlyIncome: string;
    interviewerName: string;
    studentName: string;
  };
}
