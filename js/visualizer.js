/**
 * מרכז מדעי המחשב — מקיף דוד טוביהו | אלון שרייבמן
 * מנוע הבקרה, הרינדור והאינטראקציה — סטודיו OOP והורשה ב-C# (Visualizer Engine)
 */

class OOPVisualizerApp {
    constructor() {
        this.interpreter = new CSharpOOPInterpreter();
        this.snapshots = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.playTimer = null;
        this.files = {};
        this.activeFilename = 'Program.cs';

        this.initPresets();
        this.initDOM();
        this.attachEvents();
        this.loadPreset('clean_chain');
    }

    initPresets() {
        this.presets = {
            'clean': {
                name: '✨ פרויקט נקי (רק Program.Main ריק)',
                files: {
                    'Program.cs': `class Program
{
    static void Main()
    {
        
    }
}`
                }
            },
            'clean_chain': {
                name: '🔹 שרשרת 3 רמות: A ➔ B ➔ C (שרשור בנאים ו-Show)',
                files: {
                    'Program.cs': `class Program
{
    static void Main()
    {
        // יצירת אובייקט C המכיל את שכבות B ו-A
        C obj = new C(10, 20, 30);

        // הפעלת פעולה דרוסה
        obj.Show();
    }
}`,
                    'A.cs': `public class A
{
    protected int x;

    public A(int x)
    {
        this.x = x;
    }

    public virtual void Show()
    {
        Console.WriteLine($"A: x = {x}");
    }
}`,
                    'B.cs': `public class B : A
{
    protected int y;

    public B(int x, int y) : base(x)
    {
        this.y = y;
    }

    public override void Show()
    {
        Console.WriteLine($"B: x = {x}, y = {y}");
    }
}`,
                    'C.cs': `public class C : B
{
    private int z;

    public C(int x, int y, int z) : base(x, y)
    {
        this.z = z;
    }

    public override void Show()
    {
        Console.WriteLine($"C: x = {x}, y = {y}, z = {z}");
    }
}`
                }
            },
            'basic_chain': {
                name: 'שרשרת 3 רמות בסיסית (A ➔ B ➔ C)',
                files: {
                    'Program.cs': `class Program
{
    static void Main()
    {
        Console.WriteLine("--- 1. יצירת אובייקט C ושירשור בנאים ---");
        A obj = new C("אלון", 100, true);

        Console.WriteLine("--- 2. הפעלת פעולה פולימורפית Speak() ---");
        obj.Speak();

        Console.WriteLine("--- 3. בדיקת תיאור ToString() ---");
        Console.WriteLine(obj.ToString());
    }
}`,
                    'A.cs': `public class A
{
    protected string name;

    public A(string name)
    {
        this.name = name;
        Console.WriteLine("בנאי מחלקת בסיס A הופעל");
    }

    public virtual void Speak()
    {
        Console.WriteLine($"A אומר: שלום {name}");
    }

    public override string ToString()
    {
        return $"[A: name={name}]";
    }
}`,
                    'B.cs': `public class B : A
{
    protected int level;

    public B(string name, int level) : base(name)
    {
        this.level = level;
        Console.WriteLine("בנאי מחלקת ביניים B הופעל");
    }

    public override void Speak()
    {
        Console.WriteLine($"B אומר: רמה {level} עבור {name}");
    }

    public override string ToString()
    {
        return $"[B: level={level}, base={base.ToString()}]";
    }
}`,
                    'C.cs': `public class C : B
{
    private bool isActive;

    public C(string name, int level, bool isActive) : base(name, level)
    {
        this.isActive = isActive;
        Console.WriteLine("בנאי מחלקה נגזרת C הופעל");
    }

    public override void Speak()
    {
        Console.WriteLine($"C אומר: {name} פעיל={isActive}, רמה={level}!");
    }

    public override string ToString()
    {
        return $"[C: active={isActive}, base={base.ToString()}]";
    }
}`
                }
            },
            'employee_hierarchy': {
                name: 'היררכיית עובדים (EmployeeHierarchy — מערך הטרוגני)',
                files: {
                    'Program.cs': `class Program
{
    static void Main()
    {
        Console.WriteLine("--- יצירת מערך הטרוגני של עובדים ---");
        Employee[] team = new Employee[2];
        team[0] = new Manager("101", "יוסי", 15000, 3000, 5);
        team[1] = new Developer("102", "מאיה", 18000, 20, 150);

        double totalPayroll = 0;
        for (int i = 0; i < team.Length; i++)
        {
            Employee emp = team[i];
            Console.WriteLine(emp.GetDetails());
            double pay = emp.CalculateSalary();
            Console.WriteLine($"שכר לתשלום: {pay}");
            totalPayroll += pay;
        }
        Console.WriteLine($"סה\"כ שכר לחברה: {totalPayroll}");
    }
}`,
                    'Employee.cs': `public class Employee
{
    protected string id;
    protected string name;
    protected double baseSalary;

    public Employee(string id, string name, double baseSalary)
    {
        this.id = id;
        this.name = name;
        this.baseSalary = baseSalary;
    }

    public virtual double CalculateSalary()
    {
        return this.baseSalary;
    }

    public virtual string GetDetails()
    {
        return $"עובד: {name} (ת\"ז: {id}), שכר יסוד: {baseSalary}";
    }
}`,
                    'Manager.cs': `public class Manager : Employee
{
    private double bonus;
    private int teamSize;

    public Manager(string id, string name, double baseSalary, double bonus, int teamSize)
        : base(id, name, baseSalary)
    {
        this.bonus = bonus;
        this.teamSize = teamSize;
    }

    public override double CalculateSalary()
    {
        return base.CalculateSalary() + this.bonus;
    }

    public override string GetDetails()
    {
        return $"מנהל: {name}, גודל צוות: {teamSize}, בונוס: {bonus}";
    }
}`,
                    'Developer.cs': `public class Developer : Employee
{
    private int overtimeHours;
    private double hourlyOvertimeRate;

    public Developer(string id, string name, double baseSalary, int overtimeHours, double rate)
        : base(id, name, baseSalary)
    {
        this.overtimeHours = overtimeHours;
        this.hourlyOvertimeRate = rate;
    }

    public override double CalculateSalary()
    {
        return base.CalculateSalary() + (this.overtimeHours * this.hourlyOvertimeRate);
    }

    public override string GetDetails()
    {
        return $"מפתח: {name}, שעות נוספות: {overtimeHours} (תעריף: {hourlyOvertimeRate})";
    }
}`
                }
            },
            'empty_starter': {
                name: '📄 פרויקט ריק להתחלה מאפס (Blank Canvas)',
                files: {
                    'Program.cs': `class Program
{
    static void Main()
    {
        // התחל לכתוב את הקוד שלך כאן...
        MyClass obj = new MyClass();
    }
}`,
                    'MyClass.cs': `public class MyClass
{
    public MyClass()
    {
        
    }
}`
                }
            }
        };
    }

    initDOM() {
        this.dom = {
            // Splitter
            splitter: document.getElementById('layout-splitter-horizontal'),
            mainContainer: document.querySelector('.main-container'),
            
            // Buttons & Controls
            btnPlay: document.getElementById('btn-play'),
            btnStepPrev: document.getElementById('btn-step-prev'),
            btnStepNext: document.getElementById('btn-step-next'),
            btnReset: document.getElementById('btn-reset'),
            speedSlider: document.getElementById('speed-slider'),
            stepCounter: document.getElementById('step-counter'),
            exampleSelect: document.getElementById('example-code-select'),
            btnAddClassTab: document.getElementById('btn-add-class-tab'),

            // Editor
            editorTabsList: document.getElementById('editor-tabs-list'),
            codeTextarea: document.getElementById('code-textarea'),
            codeHighlighter: document.getElementById('code-highlighter'),
            lineNumbers: document.getElementById('line-numbers'),
            autocompletePopup: document.getElementById('autocomplete-popup'),

            // Status Banner
            statusBanner: document.getElementById('status-banner'),
            statusIcon: document.getElementById('status-icon'),
            statusText: document.getElementById('status-text'),

            // Stage Panels
            tabBtnMemory: document.getElementById('tab-btn-memory'),
            tabBtnUml: document.getElementById('tab-btn-uml'),
            tabPaneMemory: document.getElementById('tab-pane-memory'),
            tabPaneUml: document.getElementById('tab-pane-uml'),

            // Memory Canvas
            stackList: document.getElementById('stack-list'),
            heapStage: document.getElementById('heap-stage'),
            svgArrowLayer: document.getElementById('svg-arrow-layer'),
            umlStage: document.getElementById('uml-stage'),

            // Inspection Tabs
            tabBtnVars: document.getElementById('tab-btn-vars'),
            tabBtnStack: document.getElementById('tab-btn-stack'),
            tabBtnConsole: document.getElementById('tab-btn-console'),
            tabPaneVars: document.getElementById('tab-pane-vars'),
            tabPaneStack: document.getElementById('tab-pane-stack'),
            tabPaneConsole: document.getElementById('tab-pane-console'),
            variablesTbody: document.getElementById('variables-tbody'),
            callStackList: document.getElementById('call-stack-list'),
            consoleOutput: document.getElementById('console-output'),
            consoleCountBadge: document.getElementById('console-count-badge')
        };

        // אתחול מנוע השלמה אוטומטית
        if (typeof AutocompleteEngine !== 'undefined' && this.dom.autocompletePopup) {
            this.autocomplete = new AutocompleteEngine(
                this.dom.codeTextarea,
                this.dom.autocompletePopup,
                () => {
                    this.files[this.activeFilename] = this.dom.codeTextarea.value;
                    this.updateLineNumbers();
                    this.updateHighlighter();
                    this.recompile();
                }
            );
        }
    }

    attachEvents() {
        // בקרת הרצה
        this.dom.btnPlay.addEventListener('click', () => this.togglePlay());
        this.dom.btnStepNext.addEventListener('click', () => this.stepNext());
        this.dom.btnStepPrev.addEventListener('click', () => this.stepPrev());
        this.dom.btnReset.addEventListener('click', () => this.resetRun());

        // בחירת דוגמה
        this.dom.exampleSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
            }
        });

        // הוספת מחלקה חדשה
        this.dom.btnAddClassTab.addEventListener('click', () => this.promptNewClass());

        // עריכת קוד
        this.dom.codeTextarea.addEventListener('input', () => {
            this.files[this.activeFilename] = this.dom.codeTextarea.value;
            this.updateLineNumbers();
            this.updateHighlighter();
            this.recompile();
        });

        this.dom.codeTextarea.addEventListener('scroll', () => {
            this.dom.codeHighlighter.scrollTop = this.dom.codeTextarea.scrollTop;
            this.dom.codeHighlighter.scrollLeft = this.dom.codeTextarea.scrollLeft;
            this.dom.lineNumbers.scrollTop = this.dom.codeTextarea.scrollTop;
        });

        // מקש Tab בעורך
        this.dom.codeTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !this.autocomplete?.isOpen) {
                e.preventDefault();
                const start = this.dom.codeTextarea.selectionStart;
                const end = this.dom.codeTextarea.selectionEnd;
                const val = this.dom.codeTextarea.value;
                this.dom.codeTextarea.value = val.substring(0, start) + "    " + val.substring(end);
                this.dom.codeTextarea.selectionStart = this.dom.codeTextarea.selectionEnd = start + 4;
                this.files[this.activeFilename] = this.dom.codeTextarea.value;
                this.updateHighlighter();
            }
        });

        // כרטיסיות במה ראשית (Stack & Heap / UML)
        this.dom.tabBtnMemory.addEventListener('click', () => this.switchStageTab('memory'));
        this.dom.tabBtnUml.addEventListener('click', () => this.switchStageTab('uml'));

        // כרטיסיות מעקב תחתונות (Variables / Stack / Console)
        this.dom.tabBtnVars.addEventListener('click', () => this.switchInspectTab('vars'));
        this.dom.tabBtnStack.addEventListener('click', () => this.switchInspectTab('stack'));
        this.dom.tabBtnConsole.addEventListener('click', () => this.switchInspectTab('console'));

        // שינוי רוחב Splitter
        this.setupSplitter();

        // ציור חצים בעת שינוי גודל חלון או גלילה
        window.addEventListener('resize', () => this.drawReferenceArrows());
        this.dom.heapStage.addEventListener('scroll', () => this.drawReferenceArrows());
        this.dom.stackList.addEventListener('scroll', () => this.drawReferenceArrows());
    }

    setupSplitter() {
        let isDragging = false;
        this.dom.splitter.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.dom.splitter.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const containerRect = this.dom.mainContainer.getBoundingClientRect();
            // חישוב מבוסס RTL: צד ימין הוא הבמה
            const offsetRight = containerRect.right - e.clientX;
            const totalWidth = containerRect.width;
            const visualWidth = Math.max(350, Math.min(totalWidth - 350, offsetRight));
            const editorWidth = totalWidth - visualWidth - 10;

            this.dom.mainContainer.style.setProperty('--visual-panel-width', `${visualWidth}px`);
            this.dom.mainContainer.style.setProperty('--editor-column-width', `${editorWidth}px`);
            this.drawReferenceArrows();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.dom.splitter.classList.remove('dragging');
                document.body.style.cursor = '';
                this.drawReferenceArrows();
            }
        });
    }

    loadPreset(key) {
        const preset = this.presets[key];
        if (!preset) return;

        this.pause();
        this.files = JSON.parse(JSON.stringify(preset.files));
        this.activeFilename = 'Program.cs';
        this.renderFileTabs();
        this.loadActiveFileContent();
        this.recompile();
    }

    promptNewClass() {
        const name = prompt("הזן את שם המחלקה החדשה (לדוגמה: Student או Shape):", "MyClass");
        if (!name || !name.trim()) return;

        const cleanName = name.trim().replace(/[^A-Za-z0-9_]/g, '');
        const filename = `${cleanName}.cs`;

        if (this.files[filename]) {
            alert(`קובץ בשם ${filename} כבר קיים.`);
            return;
        }

        this.files[filename] = `public class ${cleanName}\n{\n    public ${cleanName}()\n    {\n        \n    }\n}`;
        this.activeFilename = filename;
        this.renderFileTabs();
        this.loadActiveFileContent();
        this.recompile();
    }

    renderFileTabs() {
        this.dom.editorTabsList.innerHTML = '';
        for (const filename of Object.keys(this.files)) {
            const tab = document.createElement('div');
            tab.className = `file-tab ${filename === this.activeFilename ? 'active' : ''}`;
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = filename;
            tab.appendChild(titleSpan);

            // כפתור מחיקה (פרט ל-Program.cs)
            if (filename !== 'Program.cs') {
                const closeBtn = document.createElement('span');
                closeBtn.className = 'file-tab-close';
                closeBtn.textContent = '✕';
                closeBtn.title = 'מחק מחלקה';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`האם למחוק את הקובץ ${filename}?`)) {
                        delete this.files[filename];
                        if (this.activeFilename === filename) {
                            this.activeFilename = 'Program.cs';
                        }
                        this.renderFileTabs();
                        this.loadActiveFileContent();
                        this.recompile();
                    }
                });
                tab.appendChild(closeBtn);
            }

            tab.addEventListener('click', () => {
                this.activeFilename = filename;
                this.renderFileTabs();
                this.loadActiveFileContent();
                this.updateHighlighter();
            });

            this.dom.editorTabsList.appendChild(tab);
        }
    }

    loadActiveFileContent() {
        this.dom.codeTextarea.value = this.files[this.activeFilename] || '';
        this.updateLineNumbers();
        this.updateHighlighter();
    }

    updateLineNumbers() {
        const lines = (this.dom.codeTextarea.value || '').split('\n').length;
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += `<div class="line-number-item" id="line-num-${i}">${i}</div>`;
        }
        this.dom.lineNumbers.innerHTML = html;
    }

    updateHighlighter(activeLine = null) {
        const code = this.dom.codeTextarea.value || '';
        const lineCount = code.split('\n').length;
        let html = '';

        for (let i = 1; i <= lineCount; i++) {
            const lineEl = document.getElementById(`line-num-${i}`);
            if (lineEl) {
                lineEl.classList.remove('active-line-num');
            }

            if (i === activeLine) {
                html += `<div class="code-line-highlight active-line"></div>`;
                if (lineEl) {
                    lineEl.classList.add('active-line-num');
                }
            } else {
                html += `<div class="code-line-highlight"></div>`;
            }
        }
        this.dom.codeHighlighter.innerHTML = html;

        // גלילה אוטומטית לשורה הפעילה
        if (activeLine > 0) {
            const lineHeight = 22;
            const targetScroll = Math.max(0, (activeLine - 4) * lineHeight);
            if (Math.abs(this.dom.codeTextarea.scrollTop - targetScroll) > 120) {
                this.dom.codeTextarea.scrollTop = targetScroll;
            }
        }
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    switchStageTab(tab) {
        const isMem = tab === 'memory';
        this.dom.tabBtnMemory.classList.toggle('active', isMem);
        this.dom.tabBtnUml.classList.toggle('active', !isMem);
        this.dom.tabPaneMemory.classList.toggle('active', isMem);
        this.dom.tabPaneUml.classList.toggle('active', !isMem);

        if (isMem) {
            setTimeout(() => this.drawReferenceArrows(), 50);
        } else {
            this.renderUMLDiagram();
        }
    }

    switchInspectTab(tab) {
        ['vars', 'stack', 'console'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const pane = document.getElementById(`tab-pane-${t}`);
            const isActive = t === tab;
            if (btn) btn.classList.toggle('active', isActive);
            if (pane) pane.classList.toggle('active', isActive);
        });
    }

    recompile() {
        try {
            this.snapshots = this.interpreter.execute(this.files);
            this.currentStep = 0;
            this.renderStep(0);
            this.renderUMLDiagram();
        } catch (err) {
            this.snapshots = [];
            this.dom.statusIcon.textContent = '❌';
            this.dom.statusText.textContent = `שגיאת הידור / מפרש: ${err.message}`;
            this.dom.statusBanner.className = 'status-banner danger';
        }
    }

    stepNext() {
        if (this.currentStep < this.snapshots.length - 1) {
            this.currentStep++;
            this.renderStep(this.currentStep);
        } else {
            this.pause();
        }
    }

    stepPrev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep(this.currentStep);
        }
    }

    resetRun() {
        this.pause();
        this.currentStep = 0;
        this.renderStep(0);
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.dom.btnPlay.textContent = '⏸ השהה';
        this.dom.btnPlay.className = 'btn btn-danger';
        this.runLoop();
    }

    pause() {
        this.isPlaying = false;
        if (this.playTimer) clearTimeout(this.playTimer);
        this.dom.btnPlay.textContent = '▶ נגן';
        this.dom.btnPlay.className = 'btn btn-success';
    }

    runLoop() {
        if (!this.isPlaying) return;
        if (this.currentStep < this.snapshots.length - 1) {
            this.stepNext();
            const speedVal = Number(this.dom.speedSlider.value); // 1 - 10
            const delay = Math.max(150, 1600 - (speedVal * 140));
            this.playTimer = setTimeout(() => this.runLoop(), delay);
        } else {
            this.pause();
        }
    }

    /**
     * רינדור מלא של מצב הצעד הנוכחי בדיבאגר
     */
    renderStep(stepIdx) {
        if (!this.snapshots || this.snapshots.length === 0) return;
        const snap = this.snapshots[stepIdx];

        // 1. מונה צעדים וסטטוס
        this.dom.stepCounter.textContent = `צעד ${stepIdx + 1} / ${this.snapshots.length}`;
        this.dom.statusIcon.textContent = snap.action === 'dynamic_dispatch' ? '⚡' : snap.action === 'error' ? '❌' : '💡';
        this.dom.statusText.textContent = snap.desc;
        this.dom.statusBanner.className = `status-banner ${snap.action === 'error' ? 'danger' : snap.action === 'dynamic_dispatch' ? 'warning' : 'info'}`;

        // 2. סנכרון עורך הקוד והדגשת שורה
        if (snap.file && snap.file !== this.activeFilename && this.files[snap.file]) {
            this.activeFilename = snap.file;
            this.renderFileTabs();
            this.loadActiveFileContent();
        }
        this.updateHighlighter(snap.line);

        // 3. רינדור רפרנסים במחסנית (Stack)
        this.renderStack(snap.stack, snap);

        // 4. רינדור אובייקטים קונצנטריים בערימה (Russian-Doll Blobs in Heap)
        this.renderHeap(snap.heap, snap);

        // 5. ציור חיצי הצבעה מ-Stack ל-Heap
        setTimeout(() => this.drawReferenceArrows(), 30);

        // 6. טבלת מעקב משתנים
        this.renderWatchTable(snap.stack);

        // 7. מחסנית קריאות (Call Stack)
        this.renderCallStack(snap.callStack);

        // 8. מסוף פלט (Console Output)
        this.renderConsole(snap.console);
    }

    renderStack(stack, snap) {
        this.dom.stackList.innerHTML = '';
        const varEntries = Object.entries(stack);

        if (varEntries.length === 0) {
            this.dom.stackList.innerHTML = '<div style="color: #94a3b8; font-size: 0.75rem; text-align: center; margin-top: 1rem;">המחסנית ריקה...</div>';
            return;
        }

        for (const [varName, varObj] of varEntries) {
            const item = document.createElement('div');
            const isTarget = snap.targetVar === varName;
            item.className = `stack-item ${isTarget ? 'highlight' : ''}`;
            item.id = `stack-var-${varName}`;

            item.innerHTML = `
                <div class="stack-item-title">
                    <span>${varName}</span>
                    <span class="stack-item-type">${varObj.type}</span>
                </div>
                <div class="stack-item-val">
                    <span>${varObj.isRef ? `כתובת: ${varObj.value}` : `ערך: ${varObj.value}`}</span>
                    ${varObj.isRef ? `<span class="pointer-dot" id="pointer-dot-${varName}"></span>` : ''}
                </div>
            `;
            this.dom.stackList.appendChild(item);
        }
    }

    /**
     * רינדור מבנה הזיכרון כבובות רוסיות קונצנטריות
     */
    renderHeap(heap, snap) {
        this.dom.heapStage.innerHTML = '';
        const heapEntries = Object.entries(heap);

        if (heapEntries.length === 0) {
            this.dom.heapStage.innerHTML = '<div style="color: #94a3b8; font-size: 0.8rem; text-align: center; width: 100%; margin-top: 2rem;">הערימה (Heap) ריקה כרגע. אין אובייקטים מוקצים.</div>';
            return;
        }

        for (const [heapId, obj] of heapEntries) {
            const card = document.createElement('div');
            const isTarget = snap.heapId === heapId;
            card.className = `heap-object-card ${isTarget ? 'highlight' : ''}`;
            card.id = `heap-obj-${heapId}`;

            // אם מדובר במערך
            if (obj.isArray) {
                card.innerHTML = `
                    <div class="heap-object-header">
                        <span>📦 מערך ${obj.className}</span>
                        <span>[${heapId}]</span>
                    </div>
                    <div class="heap-object-content">
                        <div style="font-size: 0.75rem; color: #475569; margin-bottom: 0.3rem;">אורך מערך: ${obj.size}</div>
                        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                            ${obj.items.map((it, idx) => `
                                <div class="field-row">
                                    <span class="field-name">[${idx}]</span>
                                    <span class="field-val">${it === null ? 'null' : it}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                this.dom.heapStage.appendChild(card);
                continue;
            }

            // אובייקט רגיל עם הורשה קונצנטרית (Russian-Doll)
            card.innerHTML = `
                <div class="heap-object-header">
                    <span>📦 אובייקט ${obj.className}</span>
                    <span>כתובת: ${heapId}</span>
                </div>
                <div class="heap-object-content" id="heap-content-${heapId}">
                </div>
            `;

            const contentElem = card.querySelector(`#heap-content-${heapId}`);
            
            // בנייה קונצנטרית מקוננת:
            // hierarchy = ['A', 'B', 'C']
            // השכבה החיצונית ביותר היא C (באינדקס האחרון), המכילה את B, המכילה את A.
            let currentContainer = contentElem;
            const revHierarchy = [...obj.hierarchy].reverse(); // C, B, A

            for (let i = 0; i < revHierarchy.length; i++) {
                const layerName = revHierarchy[i];
                const layerData = obj.layers[layerName];
                const isLeaf = (i === 0);
                const isBase = (i === revHierarchy.length - 1);
                const levelClass = isLeaf ? 'layer-level-leaf' : isBase ? 'layer-level-base' : 'layer-level-mid';

                const isConstructing = (snap.heapId === heapId && snap.activeLayer === layerName && snap.action === 'ctor_body_enter');
                const isDispatchHit = (snap.heapId === heapId && snap.resolvedClass === layerName && snap.action === 'dynamic_dispatch');

                const layerBox = document.createElement('div');
                layerBox.className = `doll-layer ${levelClass} ${isConstructing ? 'constructing' : ''} ${isDispatchHit ? 'dispatch-hit' : ''}`;
                layerBox.id = `layer-${heapId}-${layerName}`;

                const badgeText = isLeaf ? 'נגזרת (Derived)' : isBase ? 'בסיס (Base Core)' : 'ביניים (Mid)';

                layerBox.innerHTML = `
                    <div class="doll-layer-header">
                        <span>שכבת מחלקה: ${layerName}</span>
                        <span class="layer-badge">${badgeText}</span>
                    </div>
                    <div class="layer-fields-list">
                        ${this.renderLayerFields(layerData?.fields || {}, layerName, snap)}
                    </div>
                    <div class="nested-sub-layer-container" style="margin-top: 0.35rem;"></div>
                `;

                currentContainer.appendChild(layerBox);
                currentContainer = layerBox.querySelector('.nested-sub-layer-container');
            }

            this.dom.heapStage.appendChild(card);
        }
    }

    renderLayerFields(fields, layerName, snap) {
        const clsDef = this.interpreter.classes[layerName];
        const entries = Object.entries(fields);
        if (entries.length === 0) {
            return '<div style="font-size: 0.7rem; color: #94a3b8;">אין שדות בשכבה זו</div>';
        }

        return entries.map(([fName, val]) => {
            const fDef = clsDef?.fields.find(f => f.name === fName);
            const access = fDef?.access || 'private';
            const accessIcon = access === 'public' ? '🌐' : access === 'protected' ? '🛡️' : '🔒';
            const isAssigned = (snap.activeLayer === layerName && snap.highlightAction === 'field_init');

            return `
                <div class="field-row ${isAssigned ? 'highlight-assign' : ''}">
                    <div>
                        <span class="field-access access-${access}" title="רמת כימוס: ${access}">${accessIcon}</span>
                        <span class="field-name">${fName}</span>
                    </div>
                    <span class="field-val">${JSON.stringify(val)}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * ציור חיצי קישור SVG דינמיים מ-Stack ל-Heap
     */
    drawReferenceArrows() {
        const svg = this.dom.svgArrowLayer;
        if (!svg) return;
        svg.innerHTML = '';

        const canvasRect = this.dom.tabPaneMemory.getBoundingClientRect();
        if (canvasRect.width === 0 || canvasRect.height === 0) return;

        svg.setAttribute('width', canvasRect.width);
        svg.setAttribute('height', canvasRect.height);

        // הגדרת סמן ראש חץ (Marker)
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#4f46e5" />
            </marker>
        `;
        svg.appendChild(defs);

        const snap = this.snapshots[this.currentStep];
        if (!snap || !snap.stack) return;

        for (const [varName, varObj] of Object.entries(snap.stack)) {
            if (!varObj.isRef || !varObj.heapId) continue;

            const dotElem = document.getElementById(`pointer-dot-${varName}`);
            const targetHeapElem = document.getElementById(`heap-obj-${varObj.heapId}`);

            if (dotElem && targetHeapElem) {
                const dotRect = dotElem.getBoundingClientRect();
                const heapRect = targetHeapElem.getBoundingClientRect();

                const x1 = dotRect.left + dotRect.width / 2 - canvasRect.left;
                const y1 = dotRect.top + dotRect.height / 2 - canvasRect.top;
                const x2 = heapRect.left - canvasRect.left;
                const y2 = heapRect.top + 20 - canvasRect.top;

                // יצירת קו עקום אלגנטי (Bezier Curve)
                const dx = Math.abs(x2 - x1) * 0.5;
                const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('stroke', '#4f46e5');
                path.setAttribute('stroke-width', '2.5');
                path.setAttribute('fill', 'none');
                path.setAttribute('marker-end', 'url(#arrowhead)');
                path.setAttribute('stroke-dasharray', snap.targetVar === varName ? '4,4' : 'none');

                svg.appendChild(path);
            }
        }
    }

    renderWatchTable(stack) {
        this.dom.variablesTbody.innerHTML = '';
        for (const [vName, vObj] of Object.entries(stack)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: monospace; font-weight: bold;">${vName}</td>
                <td style="font-family: monospace; color: #475569;">${vObj.type}</td>
                <td style="font-family: monospace; color: #0284c7;">${vObj.isRef ? `כתובת ערימה: ${vObj.value}` : vObj.value}</td>
            `;
            this.dom.variablesTbody.appendChild(tr);
        }
    }

    renderCallStack(callStack) {
        this.dom.callStackList.innerHTML = '';
        if (callStack.length === 0) {
            this.dom.callStackList.innerHTML = '<div style="color: #94a3b8; font-size: 0.75rem;">המחסנית ריקה</div>';
            return;
        }

        const reversed = [...callStack].reverse();
        reversed.forEach((frame, idx) => {
            const item = document.createElement('div');
            item.className = 'call-stack-item';
            item.innerHTML = `
                <span><strong>${frame.name}</strong></span>
                <span style="color: #64748b; font-size: 0.7rem;">${frame.filename}:${frame.line}</span>
            `;
            this.dom.callStackList.appendChild(item);
        });
    }

    renderConsole(consoleLines) {
        this.dom.consoleOutput.innerHTML = '';
        this.dom.consoleCountBadge.textContent = `${consoleLines.length} שורות`;

        if (consoleLines.length === 0) {
            this.dom.consoleOutput.innerHTML = '<div style="color: #64748b;">הפלט של Console.WriteLine יופיע כאן...</div>';
            return;
        }

        consoleLines.forEach((line) => {
            const div = document.createElement('div');
            div.textContent = line;
            this.dom.consoleOutput.appendChild(div);
        });

        this.dom.consoleOutput.scrollTop = this.dom.consoleOutput.scrollHeight;
    }

    renderUMLDiagram() {
        const container = this.dom.umlStage;
        if (!container) return;
        container.innerHTML = '';

        const classes = this.interpreter.classes;
        const classNames = Object.keys(classes).filter(c => c !== 'Program');

        if (classNames.length === 0) {
            container.innerHTML = '<div style="color: #94a3b8;">אין מחלקות מותאמות אישית להצגה בתרשים.</div>';
            return;
        }

        // מיון לפי עומק היררכיה (מהבסיס לנגזרת)
        const sorted = [...classNames].sort((a, b) => {
            return (classes[a]?.hierarchy.length || 0) - (classes[b]?.hierarchy.length || 0);
        });

        sorted.forEach((cName, idx) => {
            const cls = classes[cName];
            const box = document.createElement('div');
            box.className = 'uml-class-box';

            const fieldsHtml = cls.fields.map(f => `<div>${f.access === 'public' ? '+' : f.access === 'protected' ? '#' : '-'} ${f.type} ${f.name}</div>`).join('');
            const methodsHtml = Object.values(cls.methods).map(m => `<div>+ ${m.name}(${m.params.map(p => p.type).join(', ')}) : ${m.returnType}</div>`).join('');

            box.innerHTML = `
                <div class="uml-box-header">
                    ${cls.isAbstract ? '«abstract»<br>' : ''}${cName}
                </div>
                <div class="uml-box-members">
                    ${fieldsHtml || '<div style="color:#94a3b8;">(אין שדות)</div>'}
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0.2rem 0;">
                    ${methodsHtml || '<div style="color:#94a3b8;">(אין פעולות)</div>'}
                </div>
            `;

            container.appendChild(box);

            // חץ הורשה אל המחלקה הבאה אם קיימת
            if (idx < sorted.length - 1 && sorted[idx + 1] && classes[sorted[idx + 1]].baseClass === cName) {
                const arrow = document.createElement('div');
                arrow.className = 'uml-arrow';
                arrow.innerHTML = `
                    <div class="uml-arrow-line"></div>
                    <span>▲ ירושה (: ${cName})</span>
                `;
                container.appendChild(arrow);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new OOPVisualizerApp();
});
