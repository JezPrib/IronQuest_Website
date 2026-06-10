import { useState, useEffect, useRef } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       "#0d0f14",
  bgCard:   "#141720",
  bgPanel:  "#1a1e2b",
  border:   "#2a2f45",
  borderGl: "#3a4060",
  gold:     "#f0b840",
  goldDim:  "#8a6a1a",
  mana:     "#4a9eff",
  manaDim:  "#1a3a6a",
  health:   "#e03a3a",
  healthDim:"#6a1a1a",
  exp:      "#9b5cf6",
  expDim:   "#3b1a6a",
  str:      "#ff6b35",
  agi:      "#4aff9b",
  end:      "#4ac8ff",
  vit:      "#ff4ad8",
  text:     "#e8e4d8",
  textDim:  "#7a7868",
  textMid:  "#a8a490",
  green:    "#2aff8a",
  red:      "#ff4a4a",
};

// ─── Mock data ─────────────────────────────────────────────────────────────────
const HERO = {
  name: "Thornweald",
  class: "Iron Paladin",
  level: 14,
  currentExp: 3840,
  expToNext: 5000,
  gold: 2340,
  str: 72, agi: 48, end: 65, vit: 59,
  health: 420, maxHealth: 500,
  mana: 180, maxMana: 200,
  streak: 9,
  titles: ["Novice", "Iron Squire", "Bronze Knight", "Iron Paladin"],
};

const QUESTS = [
  { id:1, type:"daily", icon:"⚔️", title:"Morning Strength Raid", desc:"Complete 5x5 squat + bench + deadlift", exp:120, gold:40, stat:"STR", statColor:T.str, done:true, due:"Today" },
  { id:2, type:"bounty", icon:"🥩", title:"Protein Bounty", desc:"Hit 160g protein — log all meals in app", exp:80, gold:25, stat:"VIT", statColor:T.vit, done:true, due:"Today" },
  { id:3, type:"daily", icon:"👟", title:"Agility Scout Run", desc:"8,000 steps or 5km run", exp:90, gold:30, stat:"AGI", statColor:T.agi, done:false, due:"Today" },
  { id:4, type:"daily", icon:"😴", title:"Rest & Recovery", desc:"Log 7+ hours of sleep", exp:60, gold:20, stat:"VIT", statColor:T.vit, done:false, due:"Tonight" },
  { id:5, type:"weekly", icon:"🗡️", title:"Weekly Raid: Push Pull Legs", desc:"Complete all 3 PPL sessions this week", exp:350, gold:120, stat:"STR", statColor:T.str, done:false, due:"Sun" },
  { id:6, type:"weekly", icon:"🧪", title:"Macro Consistency", desc:"Hit macros 5 out of 7 days", exp:280, gold:90, stat:"VIT", statColor:T.vit, done:false, due:"Sun" },
];

const CHECKIN_DEFAULTS = {
  weight: "", mood: 0, steps: "", sleep: "", calories: "", protein: "", carbs: "", fats: "",
  exercises: [{ name: "", sets: "", reps: "", weight: "" }],
};

// ─── Tiny utilities ────────────────────────────────────────────────────────────
const pct = (v, m) => Math.round((v / m) * 100);

function StatBar({ label, val, max = 100, color, abbr }) {
  const p = pct(val, max);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:11, fontFamily:"monospace", color:T.textMid, letterSpacing:1 }}>{abbr}</span>
        <span style={{ fontSize:11, fontFamily:"monospace", color }}>{val}</span>
      </div>
      <div style={{ height:6, background:T.bgPanel, borderRadius:3, overflow:"hidden", border:`1px solid ${T.border}` }}>
        <div style={{ width:`${p}%`, height:"100%", background:color, borderRadius:3, transition:"width 0.6s ease", boxShadow:`0 0 6px ${color}60` }} />
      </div>
    </div>
  );
}

function ResourceBar({ label, val, max, color, colorDim }) {
  const p = pct(val, max);
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:10, color:T.textDim, letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:10, fontFamily:"monospace", color }}>{val}/{max}</span>
      </div>
      <div style={{ height:8, background:colorDim, borderRadius:4, overflow:"hidden", border:`1px solid ${color}30` }}>
        <div style={{ width:`${p}%`, height:"100%", background:color, borderRadius:4, transition:"width 0.6s ease", boxShadow:`0 0 8px ${color}80` }} />
      </div>
    </div>
  );
}

function QuestBadge({ type }) {
  const map = { daily:{ label:"DAILY", bg:"#1a2a3a", color:T.mana }, bounty:{ label:"BOUNTY", bg:"#2a2010", color:T.gold }, weekly:{ label:"WEEKLY RAID", bg:"#1a0a2a", color:T.exp } };
  const s = map[type] || map.daily;
  return <span style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:s.color, background:s.bg, border:`1px solid ${s.color}40`, borderRadius:3, padding:"2px 6px" }}>{s.label}</span>;
}

function RadarStat({ cx, cy, r, stats }) {
  const labels = ["STR","AGI","END","VIT"];
  const colors = [T.str, T.agi, T.end, T.vit];
  const vals = [stats.str, stats.agi, stats.end, stats.vit];
  const angles = [270, 0, 90, 180].map(d => (d * Math.PI) / 180);
  const maxV = 100;
  const points = vals.map((v,i) => {
    const ratio = v / maxV;
    return [cx + r * ratio * Math.cos(angles[i]), cy + r * ratio * Math.sin(angles[i])];
  });
  const poly = points.map(p => p.join(",")).join(" ");
  const gridPts = (fraction) => angles.map(a => [cx + r * fraction * Math.cos(a), cy + r * fraction * Math.sin(a)]);
  const gridPoly = (f) => gridPts(f).map(p => p.join(",")).join(" ");
  return (
    <svg width="100%" viewBox="0 0 180 180" style={{ display:"block" }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPoly(f)} fill="none" stroke={T.border} strokeWidth="0.5" />
      ))}
      {angles.map((a,i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={T.border} strokeWidth="0.5" />
      ))}
      <polygon points={poly} fill={T.exp + "30"} stroke={T.exp} strokeWidth="1.5" strokeLinejoin="round" />
      {points.map((p,i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={colors[i]} stroke={T.bg} strokeWidth={1.5} />
      ))}
      {angles.map((a,i) => {
        const lx = cx + (r+18) * Math.cos(a);
        const ly = cy + (r+18) * Math.sin(a);
        return (
          <g key={i}>
            <text x={lx} y={ly-5} textAnchor="middle" fill={colors[i]} fontSize={9} fontFamily="monospace" fontWeight={700} letterSpacing={1}>{labels[i]}</text>
            <text x={lx} y={ly+7} textAnchor="middle" fill={colors[i]} fontSize={9} fontFamily="monospace">{vals[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Ornamental border SVG ─────────────────────────────────────────────────────
function CornerOrn({ size = 14, color = T.goldDim }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ display:"block" }}>
      <path d="M0 14 L0 2 Q0 0 2 0 L14 0" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="2" cy="2" r="1.5" fill={color} />
    </svg>
  );
}

function PanelCard({ children, style = {}, glow }) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      padding: 14,
      position: "relative",
      boxShadow: glow ? `0 0 16px ${glow}20, inset 0 0 30px ${T.bg}80` : "none",
      ...style,
    }}>
      <div style={{ position:"absolute", top:4, left:4 }}><CornerOrn /></div>
      <div style={{ position:"absolute", top:4, right:4, transform:"scaleX(-1)" }}><CornerOrn /></div>
      <div style={{ position:"absolute", bottom:4, left:4, transform:"scaleY(-1)" }}><CornerOrn /></div>
      <div style={{ position:"absolute", bottom:4, right:4, transform:"scale(-1)" }}><CornerOrn /></div>
      {children}
    </div>
  );
}

// ─── HERO PROFILE SCREEN ───────────────────────────────────────────────────────
function HeroProfile() {
  const hero = HERO;
  const expPct = pct(hero.currentExp, hero.expToNext);
  return (
    <div style={{ padding: "0 2px" }}>
      {/* Title */}
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:T.gold, fontFamily:"monospace", textTransform:"uppercase", marginBottom:4 }}>Hero Profile</div>
        <div style={{ width:60, height:1, background:`linear-gradient(90deg, transparent, ${T.goldDim}, transparent)`, margin:"0 auto" }} />
      </div>

      {/* Avatar + Identity */}
      <PanelCard style={{ marginBottom:10, paddingTop:20 }} glow={T.exp}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{
              width:72, height:72, borderRadius:"50%",
              background:`radial-gradient(circle at 35% 35%, ${T.exp}40, ${T.bg})`,
              border:`2px solid ${T.exp}60`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28,
            }}>⚔️</div>
            <div style={{
              position:"absolute", bottom:-4, right:-4,
              background:T.bgCard, border:`1px solid ${T.gold}`,
              borderRadius:10, padding:"1px 6px",
              fontSize:9, fontFamily:"monospace", color:T.gold, fontWeight:700,
            }}>LV{hero.level}</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, letterSpacing:1 }}>{hero.name}</div>
            <div style={{ fontSize:11, color:T.gold, fontFamily:"monospace", letterSpacing:1.5, marginBottom:4 }}>{hero.class}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, color:T.mana, background:T.manaDim+"60", border:`1px solid ${T.mana}30`, borderRadius:3, padding:"2px 7px" }}>🔥 {hero.streak}-day streak</span>
              <span style={{ fontSize:10, color:T.gold, background:T.goldDim+"40", border:`1px solid ${T.gold}30`, borderRadius:3, padding:"2px 7px" }}>🪙 {hero.gold.toLocaleString()} gold</span>
            </div>
          </div>
        </div>
        {/* EXP Bar */}
        <div style={{ marginTop:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:9, letterSpacing:2, color:T.textDim, textTransform:"uppercase" }}>Experience</span>
            <span style={{ fontSize:9, fontFamily:"monospace", color:T.exp }}>{hero.currentExp.toLocaleString()} / {hero.expToNext.toLocaleString()}</span>
          </div>
          <div style={{ height:8, background:T.expDim, borderRadius:4, overflow:"hidden", border:`1px solid ${T.exp}30` }}>
            <div style={{ width:`${expPct}%`, height:"100%", background:`linear-gradient(90deg, ${T.exp}, #c084fc)`, borderRadius:4, boxShadow:`0 0 10px ${T.exp}80` }} />
          </div>
          <div style={{ fontSize:9, color:T.textDim, marginTop:3, textAlign:"right" }}>{hero.expToNext - hero.currentExp} XP to Level {hero.level + 1}</div>
        </div>
      </PanelCard>

      {/* Health + Mana */}
      <PanelCard style={{ marginBottom:10, paddingTop:18 }}>
        <ResourceBar label="Health" val={hero.health} max={hero.maxHealth} color={T.health} colorDim={T.healthDim} />
        <ResourceBar label="Mana / Energy" val={hero.mana} max={hero.maxMana} color={T.mana} colorDim={T.manaDim} />
      </PanelCard>

      {/* Stat Radar */}
      <PanelCard style={{ marginBottom:10, paddingTop:18 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:T.textDim, textTransform:"uppercase", textAlign:"center", marginBottom:4 }}>Attribute Matrix</div>
        <RadarStat cx={90} cy={90} r={62} stats={hero} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", marginTop:6 }}>
          <StatBar label="Strength" abbr="STR" val={hero.str} color={T.str} />
          <StatBar label="Agility" abbr="AGI" val={hero.agi} color={T.agi} />
          <StatBar label="Endurance" abbr="END" val={hero.end} color={T.end} />
          <StatBar label="Vitality" abbr="VIT" val={hero.vit} color={T.vit} />
        </div>
      </PanelCard>

      {/* Title Progression */}
      <PanelCard style={{ paddingTop:18 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:T.textDim, textTransform:"uppercase", marginBottom:10, textAlign:"center" }}>Title Progression</div>
        <div style={{ display:"flex", alignItems:"center", gap:0 }}>
          {hero.titles.map((t, i) => {
            const isActive = t === hero.class;
            const isPast = i < hero.titles.length - 1 || isActive;
            return (
              <div key={t} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{
                  width:10, height:10, borderRadius:"50%",
                  background: isActive ? T.gold : isPast ? T.goldDim : T.bgPanel,
                  border: `1px solid ${isActive ? T.gold : T.border}`,
                  boxShadow: isActive ? `0 0 8px ${T.gold}` : "none",
                }} />
                <span style={{ fontSize:8, color: isActive ? T.gold : T.textDim, textAlign:"center", letterSpacing:0.5, lineHeight:1.2 }}>{t.replace(" ", "\n")}</span>
              </div>
            );
          })}
        </div>
      </PanelCard>
    </div>
  );
}

// ─── DAILY QUEST LOG SCREEN ────────────────────────────────────────────────────
function QuestLog({ onCheckin }) {
  const [quests, setQuests] = useState(QUESTS);
  const daily = quests.filter(q => q.type !== "weekly");
  const weekly = quests.filter(q => q.type === "weekly");
  const doneCount = daily.filter(q => q.done).length;
  const totalDaily = daily.length;

  function toggle(id) {
    setQuests(qs => qs.map(q => q.id === id ? { ...q, done: !q.done } : q));
  }

  return (
    <div style={{ padding: "0 2px" }}>
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:T.mana, fontFamily:"monospace", textTransform:"uppercase", marginBottom:4 }}>Quest Log</div>
        <div style={{ width:60, height:1, background:`linear-gradient(90deg, transparent, ${T.manaDim}, transparent)`, margin:"0 auto" }} />
      </div>

      {/* Progress summary */}
      <PanelCard style={{ marginBottom:10, paddingTop:18 }} glow={T.mana}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:10, color:T.textMid, letterSpacing:1, textTransform:"uppercase" }}>Daily Bounties</span>
          <span style={{ fontSize:11, fontFamily:"monospace", color:T.mana }}>{doneCount}/{totalDaily} done</span>
        </div>
        <div style={{ height:6, background:T.manaDim, borderRadius:3, overflow:"hidden" }}>
          <div style={{ width:`${pct(doneCount, totalDaily)}%`, height:"100%", background:T.mana, borderRadius:3, boxShadow:`0 0 8px ${T.mana}70`, transition:"width 0.4s ease" }} />
        </div>
      </PanelCard>

      {/* Daily quests */}
      <div style={{ fontSize:9, letterSpacing:2, color:T.textDim, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>Daily Bounties & Quests</div>
      {daily.map(q => (
        <PanelCard key={q.id} style={{ marginBottom:8, paddingTop:16, opacity: q.done ? 0.7 : 1 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <button
              onClick={() => toggle(q.id)}
              style={{
                flexShrink:0, width:20, height:20, borderRadius:4, marginTop:1,
                background: q.done ? q.statColor : "transparent",
                border: `1.5px solid ${q.done ? q.statColor : T.border}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0,
                boxShadow: q.done ? `0 0 8px ${q.statColor}60` : "none", transition:"all 0.2s",
              }}
            >
              {q.done && <span style={{ fontSize:11, color:T.bg, fontWeight:900 }}>✓</span>}
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
                <QuestBadge type={q.type} />
                <span style={{ fontSize:10, color:T.textDim }}>Due: {q.due}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                <span style={{ fontSize:14 }}>{q.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color: q.done ? T.textDim : T.text, textDecoration: q.done ? "line-through" : "none" }}>{q.title}</span>
              </div>
              <div style={{ fontSize:10, color:T.textDim, marginBottom:6, lineHeight:1.4 }}>{q.desc}</div>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ fontSize:9, color:T.exp, fontFamily:"monospace" }}>+{q.exp} XP</span>
                <span style={{ fontSize:9, color:T.gold, fontFamily:"monospace" }}>+{q.gold} 🪙</span>
                <span style={{ fontSize:9, color:q.statColor, fontFamily:"monospace" }}>+{q.stat}</span>
              </div>
            </div>
          </div>
        </PanelCard>
      ))}

      {/* Weekly raids */}
      <div style={{ fontSize:9, letterSpacing:2, color:T.textDim, textTransform:"uppercase", margin:"14px 0 8px", paddingLeft:2 }}>Weekly Raids</div>
      {weekly.map(q => (
        <PanelCard key={q.id} style={{ marginBottom:8, paddingTop:16, border:`1px solid ${T.exp}30`, opacity: q.done ? 0.7 : 1 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <button
              onClick={() => toggle(q.id)}
              style={{
                flexShrink:0, width:20, height:20, borderRadius:4, marginTop:1,
                background: q.done ? T.exp : "transparent",
                border: `1.5px solid ${q.done ? T.exp : T.exp + "60"}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0,
                boxShadow: q.done ? `0 0 8px ${T.exp}60` : "none", transition:"all 0.2s",
              }}
            >
              {q.done && <span style={{ fontSize:11, color:T.bg, fontWeight:900 }}>✓</span>}
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <QuestBadge type="weekly" />
                <span style={{ fontSize:10, color:T.textDim }}>Ends: {q.due}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                <span style={{ fontSize:14 }}>{q.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color: q.done ? T.textDim : T.text, textDecoration: q.done ? "line-through" : "none" }}>{q.title}</span>
              </div>
              <div style={{ fontSize:10, color:T.textDim, marginBottom:6, lineHeight:1.4 }}>{q.desc}</div>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ fontSize:9, color:T.exp, fontFamily:"monospace" }}>+{q.exp} XP</span>
                <span style={{ fontSize:9, color:T.gold, fontFamily:"monospace" }}>+{q.gold} 🪙</span>
                <span style={{ fontSize:9, color:q.statColor, fontFamily:"monospace" }}>+{q.stat}</span>
              </div>
            </div>
          </div>
        </PanelCard>
      ))}

      {/* Check-in button */}
      <button
        onClick={onCheckin}
        style={{
          width:"100%", padding:"13px 0", marginTop:12,
          background:`linear-gradient(135deg, ${T.exp}30, ${T.mana}30)`,
          border:`1.5px solid ${T.mana}60`,
          borderRadius:8, cursor:"pointer",
          color:T.mana, fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase",
          boxShadow:`0 0 16px ${T.mana}20`,
        }}
      >
        ⚡ Daily Check-In
      </button>
    </div>
  );
}

// ─── DAILY CHECK-IN MODAL ──────────────────────────────────────────────────────
function CheckInModal({ onClose }) {
  const [form, setForm] = useState(CHECKIN_DEFAULTS);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const moods = ["😣","😕","😐","🙂","🔥"];
  const STEPS = ["Body", "Nutrition", "Training", "Submit"];

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function addExercise() {
    setForm(f => ({ ...f, exercises: [...f.exercises, { name:"", sets:"", reps:"", weight:"" }] }));
  }

  function setEx(i, k, v) {
    setForm(f => {
      const exs = [...f.exercises];
      exs[i] = { ...exs[i], [k]: v };
      return { ...f, exercises: exs };
    });
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  const inputStyle = {
    background: T.bgPanel, border: `1px solid ${T.border}`, borderRadius:4,
    color: T.text, padding:"7px 10px", fontSize:11, width:"100%", boxSizing:"border-box", outline:"none",
    fontFamily:"inherit",
  };
  const labelStyle = { fontSize:9, color:T.textDim, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4, display:"block" };

  if (submitted) {
    return (
      <div style={{ position:"fixed", inset:0, background:"#0009", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }}>
        <PanelCard style={{ maxWidth:320, width:"100%", textAlign:"center", padding:32 }} glow={T.exp}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.gold, letterSpacing:1, marginBottom:6 }}>Check-In Complete!</div>
          <div style={{ fontSize:11, color:T.textMid, marginBottom:16 }}>+80 XP earned · +VIT stat increased</div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, background:T.exp+"20", border:`1px solid ${T.exp}40`, borderRadius:6, padding:"8px", textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.exp }}>+80</div>
              <div style={{ fontSize:9, color:T.textDim }}>XP</div>
            </div>
            <div style={{ flex:1, background:T.gold+"20", border:`1px solid ${T.gold}40`, borderRadius:6, padding:"8px", textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.gold }}>+25</div>
              <div style={{ fontSize:9, color:T.textDim }}>Gold</div>
            </div>
            <div style={{ flex:1, background:T.vit+"20", border:`1px solid ${T.vit}40`, borderRadius:6, padding:"8px", textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.vit }}>+VIT</div>
              <div style={{ fontSize:9, color:T.textDim }}>Stat</div>
            </div>
          </div>
          <button onClick={onClose} style={{ marginTop:16, width:"100%", padding:"10px 0", background:T.exp+"30", border:`1px solid ${T.exp}60`, borderRadius:6, color:T.exp, fontSize:11, fontWeight:700, letterSpacing:1.5, cursor:"pointer", textTransform:"uppercase" }}>Done</button>
        </PanelCard>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100, padding:"0 0 0 0" }}>
      <div style={{ width:"100%", maxWidth:480, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"12px 12px 0 0", padding:16, maxHeight:"82vh", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:9, color:T.textDim, letterSpacing:2, textTransform:"uppercase" }}>Daily Check-In</div>
            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Log Today's Progress</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:4, color:T.textDim, cursor:"pointer", padding:"4px 8px", fontSize:11 }}>✕</button>
        </div>

        {/* Step tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:14 }}>
          {STEPS.map((s,i) => (
            <button key={s} onClick={() => setStep(i)} style={{
              flex:1, padding:"5px 0", borderRadius:4, cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
              background: step===i ? T.mana+"30" : T.bgPanel,
              border: `1px solid ${step===i ? T.mana : T.border}`,
              color: step===i ? T.mana : T.textDim,
            }}>{s}</button>
          ))}
        </div>

        {/* Step 0: Body */}
        {step === 0 && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={labelStyle}>Body Weight (kg)</label>
                <input style={inputStyle} type="number" placeholder="e.g. 82.5" value={form.weight} onChange={e => set("weight", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Steps Today</label>
                <input style={inputStyle} type="number" placeholder="e.g. 7500" value={form.steps} onChange={e => set("steps", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Sleep (hours)</label>
                <input style={inputStyle} type="number" placeholder="e.g. 7" value={form.sleep} onChange={e => set("sleep", e.target.value)} />
              </div>
            </div>
            <label style={labelStyle}>Mood / Energy Level</label>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              {moods.map((m,i) => (
                <button key={i} onClick={() => set("mood", i+1)} style={{
                  flex:1, padding:"10px 0", borderRadius:6, cursor:"pointer", fontSize:20,
                  background: form.mood===i+1 ? T.mana+"30" : T.bgPanel,
                  border: `1.5px solid ${form.mood===i+1 ? T.mana : T.border}`,
                  boxShadow: form.mood===i+1 ? `0 0 8px ${T.mana}40` : "none", transition:"all 0.15s",
                }}>{m}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Nutrition */}
        {step === 1 && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["calories","Calories (kcal)","e.g. 2400"], ["protein","Protein (g) 🥩","e.g. 160"], ["carbs","Carbs (g) 🌾","e.g. 280"], ["fats","Fats (g) 🫙","e.g. 70"]].map(([k, l, p]) => (
                <div key={k}>
                  <label style={labelStyle}>{l}</label>
                  <input style={inputStyle} type="number" placeholder={p} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, padding:10, background:T.bgPanel, borderRadius:6, border:`1px solid ${T.vit}20` }}>
              <div style={{ fontSize:9, color:T.vit, letterSpacing:1.5, marginBottom:4 }}>VIT IMPACT</div>
              <div style={{ fontSize:10, color:T.textDim }}>Hitting your protein target today adds +2 VIT. Consistent logging builds Vitality over time.</div>
            </div>
          </div>
        )}

        {/* Step 2: Training */}
        {step === 2 && (
          <div>
            {form.exercises.map((ex, i) => (
              <div key={i} style={{ marginBottom:10, padding:10, background:T.bgPanel, borderRadius:6, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:9, color:T.str, letterSpacing:1.5, marginBottom:6 }}>EXERCISE {i+1}</div>
                <div style={{ marginBottom:6 }}>
                  <input style={inputStyle} placeholder="Exercise name (e.g. Back Squat)" value={ex.name} onChange={e => setEx(i, "name", e.target.value)} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                  <div>
                    <label style={labelStyle}>Sets</label>
                    <input style={inputStyle} type="number" placeholder="5" value={ex.sets} onChange={e => setEx(i, "sets", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Reps</label>
                    <input style={inputStyle} type="number" placeholder="5" value={ex.reps} onChange={e => setEx(i, "reps", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Weight (kg)</label>
                    <input style={inputStyle} type="number" placeholder="100" value={ex.weight} onChange={e => setEx(i, "weight", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addExercise} style={{ width:"100%", padding:"8px 0", background:"none", border:`1px dashed ${T.border}`, borderRadius:6, color:T.textDim, cursor:"pointer", fontSize:11, letterSpacing:1 }}>+ Add Exercise</button>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:10, color:T.textMid, marginBottom:10, lineHeight:1.5 }}>
              You're submitting today's check-in. Your coach will be notified and your stats will update.
            </div>
            {[["Body weight", form.weight ? `${form.weight} kg` : "—"], ["Steps", form.steps || "—"], ["Sleep", form.sleep ? `${form.sleep}h` : "—"], ["Calories", form.calories ? `${form.calories} kcal` : "—"], ["Protein", form.protein ? `${form.protein}g` : "—"], ["Exercises", `${form.exercises.filter(e=>e.name).length} logged`]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <span style={{ color:T.textDim }}>{k}</span><span style={{ color:T.text, fontFamily:"monospace" }}>{v}</span>
              </div>
            ))}
            <button onClick={handleSubmit} style={{ width:"100%", padding:"12px 0", marginTop:14, background:`linear-gradient(135deg, ${T.exp}40, ${T.mana}40)`, border:`1.5px solid ${T.mana}80`, borderRadius:8, color:T.mana, fontSize:12, fontWeight:700, letterSpacing:2, cursor:"pointer", textTransform:"uppercase" }}>
              ⚡ Submit Check-In
            </button>
          </div>
        )}

        {/* Prev / Next */}
        {step < 3 && (
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            {step > 0 && <button onClick={() => setStep(s => s-1)} style={{ flex:1, padding:"9px 0", background:"none", border:`1px solid ${T.border}`, borderRadius:6, color:T.textDim, cursor:"pointer", fontSize:11 }}>← Back</button>}
            <button onClick={() => setStep(s => s+1)} style={{ flex:2, padding:"9px 0", background:T.mana+"20", border:`1px solid ${T.mana}50`, borderRadius:6, color:T.mana, cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COACH DASHBOARD (preview) ─────────────────────────────────────────────────
function CoachDashboard() {
  const clients = [
    { name:"Thornweald", real:"Alex M.", level:14, class:"Iron Paladin", streak:9, lastCheckin:"Today", progress:78, flag:false },
    { name:"Velkar", real:"Sam T.", level:8, class:"Bronze Knight", streak:3, lastCheckin:"Yesterday", progress:55, flag:false },
    { name:"Mireth", real:"Jordan K.", level:21, class:"Steel Warden", streak:14, lastCheckin:"Today", progress:92, flag:false },
    { name:"Duskhollow", real:"Riley P.", level:5, class:"Iron Squire", streak:0, lastCheckin:"3 days ago", progress:22, flag:true },
  ];

  return (
    <div style={{ padding:"0 2px" }}>
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:T.gold, fontFamily:"monospace", textTransform:"uppercase", marginBottom:4 }}>Guild Master</div>
        <div style={{ width:60, height:1, background:`linear-gradient(90deg, transparent, ${T.goldDim}, transparent)`, margin:"0 auto" }} />
      </div>

      {/* Summary stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
        {[["⚔️","Active","4"], ["✅","Checked In","3"], ["⚠️","Needs Attn","1"]].map(([icon, label, val]) => (
          <div key={label} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:6, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontSize:16 }}>{icon}</div>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:"monospace" }}>{val}</div>
            <div style={{ fontSize:8, color:T.textDim, letterSpacing:1 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div style={{ fontSize:9, letterSpacing:2, color:T.textDim, textTransform:"uppercase", marginBottom:8, paddingLeft:2 }}>Your Guild Members</div>
      {clients.map(c => (
        <PanelCard key={c.name} style={{ marginBottom:8, paddingTop:16, border:`1px solid ${c.flag ? T.health+"60" : T.border}`, boxShadow: c.flag ? `0 0 10px ${T.health}15` : "none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background: c.flag ? T.healthDim : T.expDim, border:`1.5px solid ${c.flag ? T.health : T.exp}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>⚔️</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{c.name}</span>
                  <span style={{ fontSize:10, color:T.textDim, marginLeft:6 }}>({c.real})</span>
                </div>
                {c.flag && <span style={{ fontSize:9, color:T.health, background:T.healthDim+"60", border:`1px solid ${T.health}40`, borderRadius:3, padding:"2px 6px" }}>⚠ LOW STREAK</span>}
              </div>
              <div style={{ fontSize:10, color:T.gold, fontFamily:"monospace" }}>Lv{c.level} {c.class}</div>
              <div style={{ display:"flex", gap:8, marginTop:3 }}>
                <span style={{ fontSize:9, color:T.textDim }}>🔥 {c.streak}-day streak</span>
                <span style={{ fontSize:9, color:T.textDim }}>Last: {c.lastCheckin}</span>
              </div>
              <div style={{ marginTop:5 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontSize:8, color:T.textDim, letterSpacing:1 }}>WEEKLY PROGRESS</span>
                  <span style={{ fontSize:8, color:T.mana, fontFamily:"monospace" }}>{c.progress}%</span>
                </div>
                <div style={{ height:4, background:T.bgPanel, borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:`${c.progress}%`, height:"100%", background: c.progress > 70 ? T.green : c.progress > 40 ? T.mana : T.health, borderRadius:2, transition:"width 0.5s ease" }} />
                </div>
              </div>
            </div>
          </div>
        </PanelCard>
      ))}

      {/* Assign quest button */}
      <button style={{ width:"100%", padding:"12px 0", marginTop:4, background:T.gold+"20", border:`1.5px solid ${T.gold}50`, borderRadius:8, color:T.gold, fontSize:11, fontWeight:700, letterSpacing:2, cursor:"pointer", textTransform:"uppercase" }}>
        ⚔️ Assign New Quest
      </button>
    </div>
  );
}

// ─── NAV ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"hero",   icon:"⚔️",  label:"Hero"    },
  { id:"quests", icon:"📜",  label:"Quests"  },
  { id:"coach",  icon:"👑",  label:"Guild Master" },
];

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("hero");
  const [showCheckin, setShowCheckin] = useState(false);

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"system-ui, -apple-system, sans-serif", color:T.text, position:"relative" }}>

      {/* Top bar */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.border}`, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:T.gold, letterSpacing:2, lineHeight:1 }}>IRONQUEST</div>
          <div style={{ fontSize:8, color:T.textDim, letterSpacing:3, textTransform:"uppercase" }}>Fitness RPG</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, color:T.exp, fontFamily:"monospace" }}>⚡ Lv14</span>
          <span style={{ fontSize:10, color:T.gold, fontFamily:"monospace" }}>🪙 2,340</span>
          <div style={{ width:28, height:28, borderRadius:"50%", background:T.expDim, border:`1.5px solid ${T.exp}60`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚔️</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"16px 14px", paddingBottom:80, maxWidth:480, margin:"0 auto" }}>
        {tab === "hero"   && <HeroProfile />}
        {tab === "quests" && <QuestLog onCheckin={() => setShowCheckin(true)} />}
        {tab === "coach"  && <CoachDashboard />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:T.bgCard, borderTop:`1px solid ${T.border}`,
        display:"flex", maxWidth:480, margin:"0 auto",
        zIndex:10,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:"10px 0 12px", background:"none",
            border:"none", borderTop:`2px solid ${tab === t.id ? T.gold : "transparent"}`,
            cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            transition:"border-color 0.15s",
          }}>
            <span style={{ fontSize:17 }}>{t.icon}</span>
            <span style={{ fontSize:8, letterSpacing:1, textTransform:"uppercase", color: tab === t.id ? T.gold : T.textDim, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {showCheckin && <CheckInModal onClose={() => setShowCheckin(false)} />}
    </div>
  );
}
