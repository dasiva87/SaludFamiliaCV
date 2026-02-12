
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { FamilyRecord, FamilyMember } from '../types';

interface FormWizardProps {
  editingId?: string | null;
  onComplete?: () => void;
}

const createInitialRecord = (): FamilyRecord => ({
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  generalData: {
    date: new Date().toISOString().split('T')[0],
    department: '',
    municipality: '',
    sisben: '',
    area: '',
    estrato: '',
    ethnicity: ''
  },
  familyInfo: {
    headLastName1: '',
    headLastName2: '',
    address: '',
    neighborhood: '',
    phone: '',
    members: [
      { id: 'cf', role: 'CF', firstName: '', lastName: '', idNumber: '', birthDate: '', age: 0, sex: 'M', eapb: '', civilStatus: '' }
    ],
    familyType: '',
    religion: ''
  },
  medicalHistory: {},
  obGynHistory: {},
  vaccinationHistory: {},
  surgicalHistory: {},
  congenitalHistory: {},
  disabilities: {},
  habits: {},
  environmentalRisks: {},
  psychologicalFactors: {},
  socioeconomic: { housingType: 'Casa', housingMaterial: 'Ladrillo', peoplePerRoom: 1, roomsCount: 1, tenure: 'Propia', housingStatus: 'Bueno' },
  housingConditions: {
    wallMaterial: '', roofMaterial: '', floorMaterial: '', specificKitchen: false, indoorKitchen: false, gasCooking: false, overcrowding: false, smokeIndoor: false, humidityIndoor: false, electricity: false, sufficientLight: false, sufficientVentilation: false, water24h: false, waterTreated: false, petsIndoor: false, pestControl: false, publicServices: {}
  },
  occupation: { economicActivity: '', monthlyIncome: '', interviewerName: '', studentName: '' }
});

const FormWizard: React.FC<FormWizardProps> = ({ editingId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [record, setRecord] = useState<FamilyRecord>(createInitialRecord());
  const [isSaved, setIsSaved] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const autoSaveTimer = useRef<number | null>(null);

  // Inicialización y carga de persistencia
  // Fix: db.getRecords() is async, so we must handle the promise
  useEffect(() => {
    const loadInitialData = async () => {
      if (editingId) {
        const records = await db.getRecords();
        const existing = records.find(r => r.id === editingId);
        if (existing) setRecord(existing);
      } else {
        const draft = db.getDraft();
        if (draft && !isDraftLoaded) {
          if (confirm("Se encontró un borrador sin terminar. ¿Desea recuperarlo?")) {
            setRecord(draft);
          } else {
            db.clearDraft();
          }
          setIsDraftLoaded(true);
        }
      }
    };
    loadInitialData();
  }, [editingId, isDraftLoaded]);

  // Efecto de auto-guardado
  useEffect(() => {
    if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    
    autoSaveTimer.current = window.setTimeout(() => {
      if (!editingId) db.saveDraft(record);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 1000);

    return () => { if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current); };
  }, [record, editingId]);

  const handleNext = () => setStep(s => Math.min(s + 1, 9));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  // Fix: db.saveRecord is async
  const finalizeSave = async () => {
    await db.saveRecord(record);
    db.clearDraft();
    alert('Información guardada permanentemente en la base de datos local.');
    if (onComplete) onComplete();
  };

  const updateNestedField = (section: keyof FamilyRecord, field: string, value: any) => {
    setRecord(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value }
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 data={record.generalData} onChange={(f, v) => updateNestedField('generalData', f, v)} />;
      case 2: return <Step2 data={record.familyInfo} onChange={(f, v) => updateNestedField('familyInfo', f, v)} />;
      case 3: return <Step3 record={record} setRecord={setRecord} />;
      case 4: return <Step4 record={record} setRecord={setRecord} />;
      case 5: return <Step5 record={record} setRecord={setRecord} />;
      case 6: return <Step6 data={record.psychologicalFactors} onChange={(v) => setRecord(p => ({...p, psychologicalFactors: v}))} />;
      case 7: return <Step7 data={record.socioeconomic} onChange={(f, v) => updateNestedField('socioeconomic', f, v)} />;
      case 8: return <Step8 data={record.housingConditions} onChange={(f, v) => updateNestedField('housingConditions', f, v)} />;
      case 9: return <Step9 data={record.occupation} onChange={(f, v) => updateNestedField('occupation', f, v)} onSave={finalizeSave} />;
      default: return null;
    }
  };

  const stepsInfo = [
    { n: 1, title: 'Datos Generales' }, { n: 2, title: 'Grupo Familiar' }, { n: 3, title: 'Antecedentes' },
    { n: 4, title: 'Discapacidades' }, { n: 5, title: 'Hábitos y Riesgos' }, { n: 6, title: 'Factor Psicológico' },
    { n: 7, title: 'Socioeconómico' }, { n: 8, title: 'Vivienda' }, { n: 9, title: 'Finalización' }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex justify-end">
         <div className={`flex items-center text-[10px] font-bold px-3 py-1 rounded-full transition-all duration-500 ${isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
            <i className={`fas ${isSaved ? 'fa-check-double' : 'fa-sync fa-spin'} mr-2`}></i>
            {isSaved ? 'DATO SINCRONIZADO' : 'SINCRONIZANDO...'}
         </div>
      </div>

      {/* STEPS PROGRESS BAR */}
      <div className="mb-10 px-2 overflow-x-auto pb-6 scrollbar-hide">
        <div className="flex justify-between items-start min-w-[850px] relative px-4">
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0"></div>
          {stepsInfo.map((s) => (
            <div key={s.n} className="flex flex-col items-center flex-1 z-10">
              {s.n > 1 && (
                <div className={`absolute top-5 h-0.5 -z-10 ${step >= s.n ? 'bg-brand' : 'bg-transparent'}`} 
                     style={{ left: `${(s.n-2) * 11.1 + 5.5}%`, width: '11.1%' }}></div>
              )}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === s.n ? 'bg-brand text-white ring-4 ring-brand-light scale-110 shadow-lg' : 
                step > s.n ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s.n ? <i className="fas fa-check"></i> : s.n}
              </div>
              <div className="mt-3 flex flex-col items-center max-w-[90px]">
                <span className={`text-[9px] font-bold uppercase tracking-tight text-center leading-tight transition-colors duration-300 ${
                  step === s.n ? 'text-brand' : step > s.n ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {s.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{stepsInfo[step-1].title}</h2>
            {editingId && <p className="text-xs text-brand font-bold uppercase mt-1">Editando Registro: {editingId.slice(0,8)}</p>}
          </div>
        </div>
        
        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        <div className="mt-12 flex justify-between pt-6 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-chevron-left mr-2"></i> Anterior
          </button>
          <div className="space-x-4">
            <button
              onClick={async () => { await db.saveRecord(record); alert('Progreso manual guardado.'); }}
              className="px-6 py-2.5 rounded-xl text-slate-600 font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Guardar Forzado
            </button>
            {step < 9 ? (
              <button
                onClick={handleNext}
                className="px-8 py-2.5 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark shadow-lg shadow-brand/20 transition-all"
              >
                Siguiente <i className="fas fa-chevron-right ml-2"></i>
              </button>
            ) : (
              <button
                onClick={finalizeSave}
                className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
              >
                {editingId ? 'Actualizar Registro' : 'Completar Registro'} <i className="fas fa-check ml-2"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Step Components (Step1-9) ---

const Step1: React.FC<{ data: any, onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Fecha de Valoración</label>
      <input type="date" value={data.date} onChange={e => onChange('date', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Departamento</label>
      <input type="text" value={data.department} placeholder="ej. Bolívar" onChange={e => onChange('department', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Municipio</label>
      <input type="text" value={data.municipality} placeholder="ej. Cartagena" onChange={e => onChange('municipality', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Nivel de Sisbén</label>
      <input type="text" value={data.sisben} placeholder="ej. A1" onChange={e => onChange('sisben', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
    </div>
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Área</label>
      <select value={data.area} onChange={e => onChange('area', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none">
        <option value="">Seleccionar...</option>
        <option value="Rural">1. Rural</option>
        <option value="Urbana">2. Urbana</option>
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Estrato Socioeconómico</label>
      <input type="number" min="0" max="6" value={data.estrato} onChange={e => onChange('estrato', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
    </div>
    <div className="space-y-2 md:col-span-2">
      <label className="text-sm font-semibold text-slate-700">Pertenencia Étnica</label>
      <input type="text" value={data.ethnicity} placeholder="Indígena, Afrocolombiano, Mestizo..." onChange={e => onChange('ethnicity', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
    </div>
  </div>
);

const Step2: React.FC<{ data: any, onChange: (f: string, v: any) => void }> = ({ data, onChange }) => {
  const addMember = () => {
    const roles = ['CF', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] as const;
    const nextRole = roles[data.members.length] || `M${data.members.length}`;
    const newMember: FamilyMember = {
      id: crypto.randomUUID(), role: nextRole as any, firstName: '', lastName: '', idNumber: '', birthDate: '', age: 0, sex: 'M', eapb: '', civilStatus: ''
    };
    onChange('members', [...data.members, newMember]);
  };
  const updateMember = (index: number, field: string, value: any) => {
    const newMembers = [...data.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    onChange('members', newMembers);
  };
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Primer Apellido Cabeza de Familia" value={data.headLastName1} onChange={e => onChange('headLastName1', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
        <input type="text" placeholder="Segundo Apellido" value={data.headLastName2} onChange={e => onChange('headLastName2', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
        <input type="text" placeholder="Dirección" value={data.address} onChange={e => onChange('address', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
        <input type="text" placeholder="Barrio" value={data.neighborhood} onChange={e => onChange('neighborhood', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
        <input type="tel" placeholder="Teléfono" value={data.phone} onChange={e => onChange('phone', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Rol</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Nombre</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Apellido</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Identificación</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">F. Nacimiento</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase w-20">Edad</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase w-24">Sexo</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">EAPB</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Estado Civil</th>
            </tr>
          </thead>
          <tbody>
            {data.members.map((m: FamilyMember, idx: number) => (
              <tr key={m.id} className="border-b border-slate-100">
                <td className="p-2 font-bold text-brand">{m.role}</td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" placeholder="Nombre" value={m.firstName} onChange={e => updateMember(idx, 'firstName', e.target.value)} /></td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" placeholder="Apellido" value={m.lastName} onChange={e => updateMember(idx, 'lastName', e.target.value)} /></td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" value={m.idNumber} onChange={e => updateMember(idx, 'idNumber', e.target.value)} /></td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" type="date" value={m.birthDate} onChange={e => updateMember(idx, 'birthDate', e.target.value)} /></td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" type="number" value={m.age} onChange={e => updateMember(idx, 'age', parseInt(e.target.value) || 0)} /></td>
                <td className="p-2">
                  <select className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" value={m.sex} onChange={e => updateMember(idx, 'sex', e.target.value)}>
                    <option value="M">M</option><option value="F">F</option>
                  </select>
                </td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" value={m.eapb} onChange={e => updateMember(idx, 'eapb', e.target.value)} /></td>
                <td className="p-2"><input className="w-full p-2 bg-slate-50 rounded focus:ring-1 focus:ring-brand outline-none" value={m.civilStatus} onChange={e => updateMember(idx, 'civilStatus', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addMember} className="text-brand font-bold text-sm hover:underline"><i className="fas fa-plus-circle mr-1"></i> Añadir Integrante</button>
    </div>
  );
};

const MatrixInput: React.FC<{ title: string, rows: string[], members: FamilyMember[], data: any, onChange: (row: string, memberRole: string, val: any) => void }> = ({ title, rows, members, data, onChange }) => (
  <div className="mb-8 last:mb-0">
    <div className="bg-slate-50 px-4 py-3 rounded-t-xl border-x border-t border-slate-200">
      <h3 className="text-md font-bold text-slate-700 flex items-center"><span className="w-2 h-2 bg-brand rounded-full mr-2"></span> {title}</h3>
    </div>
    <div className="overflow-x-auto border-x border-b border-slate-200 rounded-b-xl">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200">
            <th className="p-3 text-xs font-bold text-slate-500 uppercase w-1/3">Ítem / Antecedente</th>
            {members.map(m => (
              <th key={m.role} className="p-3 text-center text-xs font-bold text-brand min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-normal uppercase">{m.role}</div>
                <div className="truncate max-w-[100px]">{m.firstName || '---'}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr key={row} className="hover:bg-slate-50 transition-colors">
              <td className="p-3 text-sm text-slate-700 font-medium">{row}</td>
              {members.map(m => (
                <td key={m.role} className="p-3 text-center">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-brand cursor-pointer focus:ring-brand" checked={!!data[row]?.[m.role]} onChange={e => onChange(row, m.role, e.target.checked)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Step3: React.FC<{ record: FamilyRecord, setRecord: any }> = ({ record, setRecord }) => {
  const updateMatrix = (section: keyof FamilyRecord, row: string, member: string, val: any) => {
    setRecord((prev: any) => ({ ...prev, [section]: { ...prev[section], [row]: { ...(prev[section][row] || {}), [member]: val } } }));
  };
  return (
    <div className="space-y-12 pb-8">
      <MatrixInput title="3.1.1 Enfermedades Infecciosas" rows={['Tuberculosis', 'Lepra', 'Leishmaniasis', 'Paludismo', 'Cólera', 'Dengue', 'ETS', 'VIH - SIDA']} members={record.familyInfo.members} data={record.medicalHistory} onChange={(r, m, v) => updateMatrix('medicalHistory', r, m, v)} />
      <MatrixInput title="3.1.2 Crónicas" rows={['Hipertensión Arterial', 'Diabetes Mellitus', 'Artritis', 'Dislipidemias', 'Obesidad', 'Epilepsia', 'Cáncer']} members={record.familyInfo.members} data={record.medicalHistory} onChange={(r, m, v) => updateMatrix('medicalHistory', r, m, v)} />
      <MatrixInput title="3.2 Ginecobstétricos" rows={['Toma Citología', 'Autoexamen Seno', 'Planificación', 'Embarazo Actual']} members={record.familyInfo.members} data={record.obGynHistory} onChange={(r, m, v) => updateMatrix('obGynHistory', r, m, v)} />
      <MatrixInput title="3.3 Esquema de Vacunación" rows={['Menor 1 año', '1 año', '5 años', 'VPH', 'COVID-19']} members={record.familyInfo.members} data={record.vaccinationHistory} onChange={(r, m, v) => updateMatrix('vaccinationHistory', r, m, v)} />
    </div>
  );
};

const Step4: React.FC<{ record: FamilyRecord, setRecord: any }> = ({ record, setRecord }) => (
  <MatrixInput title="4. Discapacidades" rows={['Limitación física', 'Limitación mental', 'Sordera', 'Ceguera']} members={record.familyInfo.members} data={record.disabilities} onChange={(r, m, v) => setRecord((prev: any) => ({ ...prev, disabilities: { ...prev.disabilities, [r]: { ...(prev.disabilities[r] || {}), [m]: v } } }))} />
);

const Step5: React.FC<{ record: FamilyRecord, setRecord: any }> = ({ record, setRecord }) => (
  <div className="space-y-6">
    <MatrixInput title="5.1 Hábitos" rows={['Fumar', 'Consumo Alcohol', 'Consumo Drogas', 'Realiza Ejercicio']} members={record.familyInfo.members} data={record.habits} onChange={(r, m, v) => setRecord((prev: any) => ({ ...prev, habits: { ...prev.habits, [r]: { ...(prev.habits[r] || {}), [m]: v } } }))} />
  </div>
);

const Step6: React.FC<{ data: any, onChange: (v: any) => void }> = ({ data, onChange }) => {
  const questions = ["¿Buenas relaciones cordiales?", "¿Prácticas recreativas?", "¿Niños quedan solos?", "¿Corrección adecuada?", "¿Separación conyugal?"];
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-sm font-medium text-slate-700">{i+1}. {q}</span>
          <div className="flex space-x-2">
            <button onClick={() => onChange({ ...data, [i]: true })} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data[i] === true ? 'bg-brand text-white' : 'bg-white'}`}>SÍ</button>
            <button onClick={() => onChange({ ...data, [i]: false })} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data[i] === false ? 'bg-brand-dark text-white' : 'bg-white'}`}>NO</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Step7: React.FC<{ data: any, onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {['housingType', 'housingMaterial', 'peoplePerRoom', 'tenure'].map(k => (
      <div key={k} className="space-y-2">
        <label className="text-sm font-semibold capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
        <input className="w-full p-3 bg-slate-50 border rounded-xl" value={data[k]} onChange={e => onChange(k, e.target.value)} />
      </div>
    ))}
  </div>
);

const Step8: React.FC<{ data: any, onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {['electricity', 'water24h', 'waterTreated', 'gasCooking', 'sufficientLight', 'sufficientVentilation', 'petsIndoor', 'pestControl'].map(k => (
      <label key={k} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
        <input type="checkbox" checked={!!data[k]} onChange={e => onChange(k, e.target.checked)} className="rounded text-brand" />
        <span className="text-xs font-medium uppercase">{k}</span>
      </label>
    ))}
  </div>
);

const Step9: React.FC<{ data: any, onChange: (f: string, v: any) => void, onSave: () => void }> = ({ data, onChange, onSave }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Actividad Económica" value={data.economicActivity} onChange={e => onChange('economicActivity', e.target.value)} />
      <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Ingreso Mensual" value={data.monthlyIncome} onChange={e => onChange('monthlyIncome', e.target.value)} />
      <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Nombre Estudiante" value={data.studentName} onChange={e => onChange('studentName', e.target.value)} />
      <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Firma Entrevistado" value={data.interviewerName} onChange={e => onChange('interviewerName', e.target.value)} />
    </div>
    <div className="bg-brand-light p-6 rounded-2xl border border-brand/10 flex items-center space-x-6">
      <div className="bg-brand text-white p-4 rounded-xl"><i className="fas fa-database text-2xl"></i></div>
      <div>
        <h4 className="font-bold text-brand-dark">Cifrado y Persistencia</h4>
        <p className="text-sm text-brand-dark">Los datos se almacenan de forma segura en este dispositivo y persistirán incluso tras reiniciar el navegador.</p>
      </div>
    </div>
  </div>
);

export default FormWizard;
