/**
 * אלון שרייבמן — מורה פרטי
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
        this.currentLanguage = localStorage.getItem('oop_visualizer_lang') || 'csharp';
        this.activeFilename = this.currentLanguage === 'java' ? 'Main.java' : 'Program.cs';

        this.initPresets();
        this.initDOM();
        this.initInputTable();
        this.attachEvents();
        this.applyLanguageUI(this.currentLanguage);
        this.loadPreset('clean_chain');
    }

    initInputTable() {
        if (typeof InputTableManager !== 'undefined') {
            this.inputTableManager = new InputTableManager({
                containerId: 'card-input-table',
                tbodyId: 'data-input-tbody',
                countBadgeId: 'input-count-badge',
                statusBadgeId: 'input-table-status-badge',
                onInputsChanged: (inputs) => {
                    this.interpreter.setInputQueue(inputs);
                    this.recompile();
                }
            });
            this.inputTableManager.onDetectRequest = () => {
                const mainCode = this.files[this.getEntryFilename()] || this.dom.codeTextarea?.value || '';
                this.inputTableManager.autoPopulateIfEmpty(mainCode);
                this.recompile();
            };
        }
    }

    initPresets() {
        this.presets = {
            'csharp': {
                'clean_chain': {
                    name: '🔹 שרשרת 3 רמות: A ➔ B ➔ C (פולימורפיזם, בנאים ו-Show)',
                    files: {
                        'Program.cs': `class Program
{
    static void Main()
    {
        // 1. פולימורפיזם: משתנה מטיפוס בסיס A מצביע על אובייקט נגזר C בערימה
        A obj = new C(10, 20, 30);

        // 2. הפעלת פעולה פולימורפית דרוסה (Dynamic Dispatch)
        obj.Show();

        // 3. המרת טיפוס מפורשת (Downcasting) וזימון פעולה
        ((C)obj).Show();
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
                'clean': {
                    name: '✨ פרויקט C# נקי (רק Program.Main ריק)',
                    files: {
                        'Program.cs': `class Program
{
    static void Main()
    {
        
    }
}`
                    }
                },
                'basic_chain': {
                    name: '📜 שרשרת מורחבת: A ➔ B ➔ C (מחרוזות ובנאים)',
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
    private bool isSpecial;

    public C(string name, int level, bool isSpecial) : base(name, level)
    {
        this.isSpecial = isSpecial;
        Console.WriteLine("בנאי מחלקה נגזרת עליונה C הופעל");
    }

    public override void Speak()
    {
        Console.WriteLine($"C מסיים: מיוחד={isSpecial}, שייך ל-{name}");
    }

    public override string ToString()
    {
        return $"[C: special={isSpecial}, base={base.ToString()}]";
    }
}`
                    }
                },
                'employee_hierarchy': {
                    name: '💼 היררכיית עובדים: Employee ➔ Manager / Developer (מערך הטרוגני)',
                    files: {
                        'Program.cs': `class Program
{
    static void Main()
    {
        Console.WriteLine("--- הדגמת פולימורפיזם ומערך הטרוגני ---");

        Employee[] team = new Employee[2];
        team[0] = new Manager("111", "מאיה", 15000, 5000, 8);
        team[1] = new Developer("222", "דניאל", 14000, 25, 200);

        double totalPayroll = 0;
        for (int i = 0; i < team.Length; i++)
        {
            Console.WriteLine(team[i].GetDetails());
            double salary = team[i].CalculateSalary();
            totalPayroll += salary;
        }

        Console.WriteLine($"סה\\"כ לתשלום שכר צוות: {totalPayroll} ש\\"ח");
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
        return baseSalary;
    }

    public virtual string GetDetails()
    {
        return $"עובד: {name} (ת.ז {id})";
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
        return base.CalculateSalary() + bonus;
    }

    public override string GetDetails()
    {
        return $"מנהל: {name}, צוות של {teamSize} עובדים, בונוס: {bonus}";
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
                'input_oop_students': {
                    name: '📥 קלט נתונים בלולאה: יצירת עצמים (Console.ReadLine)',
                    inputs: [
                        { value: '2', type: 'int', note: 'כמות סטודנטים לקליטה' },
                        { value: '18', type: 'int', note: 'גיל סטודנט 1' },
                        { value: '88.5', type: 'double', note: 'ציון סטודנט 1' },
                        { value: '19', type: 'int', note: 'גיל סטודנט 2' },
                        { value: '94.0', type: 'double', note: 'ציון סטודנט 2' }
                    ],
                    files: {
                        'Program.cs': `public class Program
{
    public static void Main()
    {
        Console.WriteLine("הכנס כמות סטודנטים לקליטה:");
        int n = int.Parse(Console.ReadLine());

        for (int i = 0; i < n; i++)
        {
            Console.WriteLine("הכנס גיל סטודנט " + (i + 1) + ":");
            int age = int.Parse(Console.ReadLine());
            Console.WriteLine("הכנס ממוצע ציונים:");
            double grade = double.Parse(Console.ReadLine());

            Student s = new Student(age, grade);
            s.Show();
        }
    }
}`,
                        'Student.cs': `public class Student
{
    private int age;
    private double grade;

    public Student(int age, double grade)
    {
        this.age = age;
        this.grade = grade;
    }

    public void Show()
    {
        Console.WriteLine($"סטודנט: גיל = {age}, ממוצע = {grade}");
    }
}`
                    }
                }
            },
            'java': {
                'clean_chain': {
                    name: '🔹 שרשרת 3 רמות ב-Java: A ➔ B ➔ C (פולימורפיזם, super ו-show)',
                    files: {
                        'Main.java': `public class Main
{
    public static void main(String[] args)
    {
        // 1. פולימורפיזם: משתנה מטיפוס בסיס A מצביע על אובייקט נגזר C בערימה
        A obj = new C(10, 20, 30);

        // 2. הפעלת פעולה פולימורפית דרוסה (Dynamic Dispatch)
        obj.show();

        // 3. המרת טיפוס מפורשת (Downcasting) וזימון פעולה
        ((C)obj).show();
    }
}`,
                        'A.java': `public class A
{
    protected int x;

    public A(int x)
    {
        this.x = x;
    }

    public void show()
    {
        System.out.println("A: x = " + x);
    }
}`,
                        'B.java': `public class B extends A
{
    protected int y;

    public B(int x, int y)
    {
        super(x);
        this.y = y;
    }

    @Override
    public void show()
    {
        System.out.println("B: x = " + x + ", y = " + y);
    }
}`,
                        'C.java': `public class C extends B
{
    private int z;

    public C(int x, int y, int z)
    {
        super(x, y);
        this.z = z;
    }

    @Override
    public void show()
    {
        System.out.println("C: x = " + x + ", y = " + y + ", z = " + z);
    }
}`
                    }
                },
                'clean': {
                    name: '✨ פרויקט Java נקי (רק Main.main ריק)',
                    files: {
                        'Main.java': `public class Main
{
    public static void main(String[] args)
    {
        
    }
}`
                    }
                },
                'basic_chain': {
                    name: '📜 שרשרת מורחבת ב-Java: A ➔ B ➔ C (מחרוזות ו-toString)',
                    files: {
                        'Main.java': `public class Main
{
    public static void main(String[] args)
    {
        System.out.println("--- 1. יצירת אובייקט C ושירשור בנאים ב-Java ---");
        A obj = new C("אלון", 100, true);

        System.out.println("--- 2. הפעלת פעולה פולימורפית speak() ---");
        obj.speak();

        System.out.println("--- 3. בדיקת תיאור toString() ---");
        System.out.println(obj.toString());
    }
}`,
                        'A.java': `public class A
{
    protected String name;

    public A(String name)
    {
        this.name = name;
        System.out.println("בנאי מחלקת בסיס A הופעל");
    }

    public void speak()
    {
        System.out.println("A אומר: שלום " + name);
    }

    @Override
    public String toString()
    {
        return "[A: name=" + name + "]";
    }
}`,
                        'B.java': `public class B extends A
{
    protected int level;

    public B(String name, int level)
    {
        super(name);
        this.level = level;
        System.out.println("בנאי מחלקת ביניים B הופעל");
    }

    @Override
    public void speak()
    {
        System.out.println("B אומר: רמה " + level + " עבור " + name);
    }

    @Override
    public String toString()
    {
        return "[B: level=" + level + ", base=" + super.toString() + "]";
    }
}`,
                        'C.java': `public class C extends B
{
    private boolean isSpecial;

    public C(String name, int level, boolean isSpecial)
    {
        super(name, level);
        this.isSpecial = isSpecial;
        System.out.println("בנאי מחלקה נגזרת עליונה C הופעל");
    }

    @Override
    public void speak()
    {
        System.out.println("C מסיים: מיוחד=" + isSpecial + ", שייך ל-" + name);
    }

    @Override
    public String toString()
    {
        return "[C: special=" + isSpecial + ", base=" + super.toString() + "]";
    }
}`
                    }
                },
                'employee_hierarchy': {
                    name: '💼 היררכיית עובדים ב-Java: Employee ➔ Manager / Developer',
                    files: {
                        'Main.java': `public class Main
{
    public static void main(String[] args)
    {
        System.out.println("--- הדגמת פולימורפיזם ומערך הטרוגני ב-Java ---");

        Employee[] team = new Employee[2];
        team[0] = new Manager("111", "מאיה", 15000, 5000, 8);
        team[1] = new Developer("222", "דניאל", 14000, 25, 200);

        double totalPayroll = 0;
        for (int i = 0; i < team.length; i++)
        {
            System.out.println(team[i].getDetails());
            double salary = team[i].calculateSalary();
            totalPayroll += salary;
        }

        System.out.println("סה\\"כ לתשלום שכר צוות: " + totalPayroll + " ש\\"ח");
    }
}`,
                        'Employee.java': `public class Employee
{
    protected String id;
    protected String name;
    protected double baseSalary;

    public Employee(String id, String name, double baseSalary)
    {
        this.id = id;
        this.name = name;
        this.baseSalary = baseSalary;
    }

    public double calculateSalary()
    {
        return baseSalary;
    }

    public String getDetails()
    {
        return "עובד: " + name + " (ת.ז " + id + ")";
    }
}`,
                        'Manager.java': `public class Manager extends Employee
{
    private double bonus;
    private int teamSize;

    public Manager(String id, String name, double baseSalary, double bonus, int teamSize)
    {
        super(id, name, baseSalary);
        this.bonus = bonus;
        this.teamSize = teamSize;
    }

    @Override
    public double calculateSalary()
    {
        return super.calculateSalary() + bonus;
    }

    @Override
    public String getDetails()
    {
        return "מנהל: " + name + ", צוות של " + teamSize + " עובדים, בונוס: " + bonus;
    }
}`,
                        'Developer.java': `public class Developer extends Employee
{
    private int overtimeHours;
    private double hourlyOvertimeRate;

    public Developer(String id, String name, double baseSalary, int overtimeHours, double rate)
    {
        super(id, name, baseSalary);
        this.overtimeHours = overtimeHours;
        this.hourlyOvertimeRate = rate;
    }

    @Override
    public double calculateSalary()
    {
        return super.calculateSalary() + (this.overtimeHours * this.hourlyOvertimeRate);
    }

    @Override
    public String getDetails()
    {
        return "מפתח: " + name + ", שעות נוספות: " + overtimeHours + " (תעריף: " + hourlyOvertimeRate + ")";
    }
}`
                    }
                },
                'input_oop_students': {
                    name: '📥 קלט נתונים בלולאה: יצירת עצמים (Scanner)',
                    inputs: [
                        { value: '2', type: 'int', note: 'כמות סטודנטים לקליטה' },
                        { value: '18', type: 'int', note: 'גיל סטודנט 1' },
                        { value: '88.5', type: 'double', note: 'ציון סטודנט 1' },
                        { value: '19', type: 'int', note: 'גיל סטודנט 2' },
                        { value: '94.0', type: 'double', note: 'ציון סטודנט 2' }
                    ],
                    files: {
                        'Main.java': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner reader = new Scanner(System.in);
        System.out.println("הכנס כמות סטודנטים לקליטה:");
        int n = reader.nextInt();

        for (int i = 0; i < n; i++) {
            System.out.println("הכנס גיל סטודנט " + (i + 1) + ":");
            int age = reader.nextInt();
            System.out.println("הכנס ממוצע ציונים:");
            double grade = reader.nextDouble();

            Student s = new Student(age, grade);
            s.show();
        }
    }
}`,
                        'Student.java': `public class Student {
    private int age;
    private double grade;

    public Student(int age, double grade) {
        this.age = age;
        this.grade = grade;
    }

    public void show() {
        System.out.println("סטודנט: גיל = " + age + ", ממוצע = " + grade);
    }
}`
                    }
                }
            }
        };
    }

    initDOM() {
        this.dom = {
            // Splitter
            splitter: document.getElementById('layout-splitter-horizontal'),
            mainContainer: document.querySelector('.main-container'),
            
            // Language selector & titles
            langBtnCsharp: document.getElementById('lang-btn-csharp'),
            langBtnJava: document.getElementById('lang-btn-java'),
            editorTitle: document.getElementById('editor-title'),

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

            // Stage Panels & Maximization
            btnMaximizeMemoryStage: document.getElementById('btn-maximize-memory-stage'),
            tabBtnMemory: document.getElementById('tab-btn-memory'),
            tabBtnUml: document.getElementById('tab-btn-uml'),
            tabPaneMemory: document.getElementById('tab-pane-memory'),
            tabPaneUml: document.getElementById('tab-pane-uml'),

            // Maximized Floating Controls
            maxFloatingControls: document.getElementById('maximized-floating-controls'),
            maxBtnPrev: document.getElementById('max-btn-prev'),
            maxBtnPlay: document.getElementById('max-btn-play'),
            maxBtnNext: document.getElementById('max-btn-next'),
            maxBtnReset: document.getElementById('max-btn-reset'),
            maxStepCounter: document.getElementById('max-step-counter'),
            maxStatusDesc: document.getElementById('max-status-desc'),
            maxBtnClose: document.getElementById('max-btn-close'),

            // Single Input Modal
            singleInputModal: document.getElementById('single-input-modal'),
            singleInputInstruction: document.getElementById('single-input-instruction'),
            singleInputCmd: document.getElementById('single-input-cmd'),
            singleInputType: document.getElementById('single-input-type'),
            singleInputField: document.getElementById('single-input-field'),
            singleInputError: document.getElementById('single-input-error'),
            btnConfirmSingleInput: document.getElementById('btn-confirm-single-input'),
            btnCancelSingleInput: document.getElementById('btn-cancel-single-input'),
            btnCloseSingleInputModal: document.getElementById('btn-close-single-input-modal'),

            // Memory Canvas
            stackList: document.getElementById('stack-list'),
            heapStage: document.getElementById('heap-stage'),
            svgArrowLayer: document.getElementById('svg-arrow-layer'),
            umlStage: document.getElementById('uml-stage'),

            // Inspection Tabs
            tabBtnVars: document.getElementById('tab-btn-vars'),
            tabBtnStack: document.getElementById('tab-btn-stack'),
            tabBtnConsole: document.getElementById('tab-btn-console'),
            tabBtnInput: document.getElementById('tab-btn-input'),
            btnQuickOpenInput: document.getElementById('btn-quick-open-input'),
            tabPaneVars: document.getElementById('tab-pane-vars'),
            tabPaneStack: document.getElementById('tab-pane-stack'),
            tabPaneConsole: document.getElementById('tab-pane-console'),
            tabPaneInput: document.getElementById('tab-pane-input'),
            variablesTbody: document.getElementById('variables-tbody'),
            callStackList: document.getElementById('call-stack-list'),
            consoleOutput: document.getElementById('console-output'),
            consoleCountBadge: document.getElementById('console-count-badge'),
            inputCountBadge: document.getElementById('input-count-badge')
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
                    this.recompile(false);
                }
            );
            this.autocomplete.setClassProvider(() => {
                return {
                    files: this.files,
                    activeFile: this.activeFilename,
                    classes: this.interpreter ? this.interpreter.classes : null
                };
            });
            if (this.currentLanguage) {
                this.autocomplete.setLanguage(this.currentLanguage);
            }
        }
    }

    attachEvents() {
        // בורר שפות: C# || Java
        if (this.dom.langBtnCsharp) {
            this.dom.langBtnCsharp.addEventListener('click', () => this.switchLanguage('csharp'));
        }
        if (this.dom.langBtnJava) {
            this.dom.langBtnJava.addEventListener('click', () => this.switchLanguage('java'));
        }

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
            this.recompile(false);
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

        // מקסום במת אנימציית OOP
        if (this.dom.btnMaximizeMemoryStage) {
            this.dom.btnMaximizeMemoryStage.addEventListener('click', () => this.toggleMaximizeMemoryStage());
        }
        if (this.dom.maxBtnClose) {
            this.dom.maxBtnClose.addEventListener('click', () => this.toggleMaximizeMemoryStage(false));
        }
        if (this.dom.maxBtnPrev) {
            this.dom.maxBtnPrev.addEventListener('click', () => this.stepPrev());
        }
        if (this.dom.maxBtnNext) {
            this.dom.maxBtnNext.addEventListener('click', () => this.stepNext());
        }
        if (this.dom.maxBtnPlay) {
            this.dom.maxBtnPlay.addEventListener('click', () => this.togglePlay());
        }
        if (this.dom.maxBtnReset) {
            this.dom.maxBtnReset.addEventListener('click', () => this.resetRun());
        }

        // מודאל קלט ידידותי עבור Console.ReadLine
        if (this.dom.btnConfirmSingleInput) {
            this.dom.btnConfirmSingleInput.addEventListener('click', () => this.confirmSingleInput());
        }
        if (this.dom.btnCancelSingleInput) {
            this.dom.btnCancelSingleInput.addEventListener('click', () => this.closeSingleInputModal());
        }
        if (this.dom.btnCloseSingleInputModal) {
            this.dom.btnCloseSingleInputModal.addEventListener('click', () => this.closeSingleInputModal());
        }
        if (this.dom.singleInputField) {
            this.dom.singleInputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmSingleInput();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const stageCard = document.querySelector('.memory-stage-card');
                if (stageCard && stageCard.classList.contains('is-maximized')) {
                    this.toggleMaximizeMemoryStage(false);
                }
                if (this.dom.singleInputModal && this.dom.singleInputModal.style.display !== 'none') {
                    this.closeSingleInputModal();
                }
            }
        });

        // כרטיסיות מעקב תחתונות (Variables / Stack / Console / Input)
        this.dom.tabBtnVars.addEventListener('click', () => this.switchInspectTab('vars'));
        this.dom.tabBtnStack.addEventListener('click', () => this.switchInspectTab('stack'));
        this.dom.tabBtnConsole.addEventListener('click', () => this.switchInspectTab('console'));
        if (this.dom.tabBtnInput) {
            this.dom.tabBtnInput.addEventListener('click', () => this.switchInspectTab('input'));
        }
        if (this.dom.btnQuickOpenInput) {
            this.dom.btnQuickOpenInput.addEventListener('click', () => this.switchInspectTab('input'));
        }

        // שינוי רוחב Splitter
        this.setupSplitter();

        // ציור חצים בעת שינוי גודל חלון או גלילה
        window.addEventListener('resize', () => this.drawReferenceArrows());
        if (this.dom.heapStage) {
            this.dom.heapStage.addEventListener('scroll', () => this.drawReferenceArrows());
        }
        if (this.dom.stackList) {
            this.dom.stackList.addEventListener('scroll', () => this.drawReferenceArrows());
        }
    }

    switchLanguage(lang) {
        if (this.currentLanguage === lang) return;
        this.currentLanguage = lang;
        localStorage.setItem('oop_visualizer_lang', lang);
        this.applyLanguageUI(lang);
        this.loadPreset('clean_chain');
    }

    applyLanguageUI(lang) {
        if (this.dom.langBtnCsharp) this.dom.langBtnCsharp.classList.toggle('active', lang === 'csharp');
        if (this.dom.langBtnJava) this.dom.langBtnJava.classList.toggle('active', lang === 'java');
        if (this.dom.editorTitle) {
            this.dom.editorTitle.textContent = lang === 'java' ? '💻 עורך קוד ומחלקות (Java)' : '💻 עורך קוד ומחלקות (C#)';
        }
        if (this.autocomplete) {
            this.autocomplete.setLanguage(lang);
        }

        // ריענון רשימת התבניות בתיבת הבחירה (Dropdown)
        if (this.dom.exampleSelect) {
            this.dom.exampleSelect.innerHTML = '';
            const currentPresets = this.presets[lang] || {};
            for (const [key, presetObj] of Object.entries(currentPresets)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = presetObj.name;
                if (key === 'clean_chain') opt.selected = true;
                this.dom.exampleSelect.appendChild(opt);
            }
        }
    }

    getEntryFilename() {
        return this.currentLanguage === 'java' ? 'Main.java' : 'Program.cs';
    }

    setupSplitter() {
        let isDragging = false;
        const splitter = this.dom.splitter;
        const container = this.dom.mainContainer;
        if (!splitter || !container) return;

        const savedWidth = localStorage.getItem('oop_viz_split_width');
        if (savedWidth) {
            const w = parseFloat(savedWidth);
            if (!isNaN(w) && w >= 25 && w <= 75) {
                container.style.setProperty('--visual-panel-width', `${w}%`);
                container.style.setProperty('--editor-column-width', `${100 - w}%`);
            }
        }

        const onPointerMove = (e) => {
            if (!isDragging) return;
            if (e.buttons === 0) {
                onPointerUp(e);
                return;
            }
            const containerRect = container.getBoundingClientRect();
            const totalWidth = container.clientWidth;
            if (totalWidth <= 0) return;

            // In RTL, visual panel is on the right
            const offsetRight = containerRect.right - e.clientX;
            const minVisual = 320;
            const minEditor = 280;
            const maxVisual = Math.max(minVisual + 40, totalWidth - minEditor - 20);
            const clamped = Math.max(minVisual, Math.min(maxVisual, offsetRight));

            const visualPercent = (clamped / totalWidth) * 100;
            const editorPercent = 100 - visualPercent;

            container.style.setProperty('--visual-panel-width', `${visualPercent.toFixed(2)}%`);
            container.style.setProperty('--editor-column-width', `${editorPercent.toFixed(2)}%`);
            try {
                localStorage.setItem('oop_viz_split_width', visualPercent.toFixed(2));
            } catch (err) {}
            this.drawReferenceArrows();
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            splitter.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            if (e && e.pointerId != null) {
                try { splitter.releasePointerCapture(e.pointerId); } catch (_) {}
            }
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            this.drawReferenceArrows();
        };

        splitter.addEventListener('pointerdown', (e) => {
            if (e.button && e.button !== 0) return;
            isDragging = true;
            splitter.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            try { splitter.setPointerCapture(e.pointerId); } catch (_) {}

            window.addEventListener('pointermove', onPointerMove, { passive: false });
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
            e.preventDefault();
        });

        splitter.addEventListener('dblclick', () => {
            container.style.setProperty('--visual-panel-width', '58%');
            container.style.setProperty('--editor-column-width', '42%');
            try {
                localStorage.setItem('oop_viz_split_width', '58');
            } catch (err) {}
            this.drawReferenceArrows();
        });
    }

    loadPreset(key) {
        const langPresets = this.presets[this.currentLanguage] || this.presets['csharp'];
        const preset = langPresets[key] || Object.values(langPresets)[0];
        if (!preset) return;

        this.pause();
        this.files = JSON.parse(JSON.stringify(preset.files));
        const entryFile = this.getEntryFilename();
        this.activeFilename = this.files[entryFile] ? entryFile : Object.keys(this.files)[0];
        this.renderFileTabs();
        this.loadActiveFileContent();

        if (this.inputTableManager) {
            if (preset.inputs && preset.inputs.length > 0) {
                this.inputTableManager.setInputs(preset.inputs);
                this.switchInspectTab('input');
            } else {
                const mainCode = this.files[entryFile] || '';
                this.inputTableManager.autoPopulateIfEmpty(mainCode);
            }
        }

        this.recompile();
    }

    promptNewClass() {
        const ext = this.currentLanguage === 'java' ? '.java' : '.cs';
        const name = prompt(`הזן את שם המחלקה החדשה (לדוגמה: Student או Shape):`, "MyClass");
        if (!name || !name.trim()) return;

        const cleanName = name.trim().replace(/[^A-Za-z0-9_]/g, '');
        const filename = `${cleanName}${ext}`;

        if (this.files[filename]) {
            alert(`קובץ בשם ${filename} כבר קיים.`);
            return;
        }

        this.files[filename] = `public class ${cleanName}\n{\n    public ${cleanName}()\n    {\n        \n    }\n}`;
        this.activeFilename = filename;
        this.renderFileTabs();
        this.loadActiveFileContent();
        this.recompile(false);
        setTimeout(() => {
            if (this.dom.codeTextarea) {
                this.dom.codeTextarea.focus();
            }
        }, 50);
    }

    renderFileTabs() {
        this.dom.editorTabsList.innerHTML = '';
        const entryFile = this.getEntryFilename();

        for (const filename of Object.keys(this.files)) {
            const tab = document.createElement('div');
            tab.className = `file-tab ${filename === this.activeFilename ? 'active' : ''}`;
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = filename;
            tab.appendChild(titleSpan);

            // כפתור מחיקה (פרט לקובץ הכניסה הראשי)
            if (filename !== entryFile && filename !== 'Program.cs' && filename !== 'Main.java') {
                const closeBtn = document.createElement('span');
                closeBtn.className = 'file-tab-close';
                closeBtn.textContent = '✕';
                closeBtn.title = 'מחק מחלקה';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`האם למחוק את הקובץ ${filename}?`)) {
                        delete this.files[filename];
                        if (this.activeFilename === filename) {
                            this.activeFilename = this.files[entryFile] ? entryFile : Object.keys(this.files)[0];
                        }
                        this.renderFileTabs();
                        this.loadActiveFileContent();
                        this.recompile(false);
                    }
                });
                tab.appendChild(closeBtn);
            }

            tab.addEventListener('click', () => {
                this.activeFilename = filename;
                this.renderFileTabs();
                this.loadActiveFileContent();
                this.updateHighlighter();
                this.recompile(false);
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

    updateHighlighter(activeLine = null, isInputStep = false) {
        const code = this.dom.codeTextarea.value || '';
        const lineCount = code.split('\n').length;
        let html = '';

        for (let i = 1; i <= lineCount; i++) {
            const lineEl = document.getElementById(`line-num-${i}`);
            if (lineEl) {
                lineEl.classList.remove('active-line-num', 'active-input-num');
            }

            if (i === activeLine) {
                const hlClass = isInputStep ? 'code-line-highlight active-line active-input-line' : 'code-line-highlight active-line';
                html += `<div class="${hlClass}"></div>`;
                if (lineEl) {
                    lineEl.classList.add('active-line-num');
                    if (isInputStep) lineEl.classList.add('active-input-num');
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
        ['vars', 'stack', 'console', 'input'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const pane = document.getElementById(`tab-pane-${t}`);
            const isActive = t === tab;
            if (btn) btn.classList.toggle('active', isActive);
            if (pane) pane.classList.toggle('active', isActive);
        });
    }

    recompile(allowTabSwitch = false) {
        try {
            let inputValues = [];
            if (this.inputTableManager) {
                inputValues = this.inputTableManager.getInputValues();
                if ((!inputValues || inputValues.length === 0) && this.files) {
                    const mainCode = this.files[this.getEntryFilename()] || this.dom.codeTextarea?.value || '';
                    this.inputTableManager.autoPopulateIfEmpty(mainCode);
                    inputValues = this.inputTableManager.getInputValues();
                }
            }
            this.snapshots = this.interpreter.execute(this.files, inputValues);
            this.currentStep = 0;
            this.renderStep(0, allowTabSwitch);
            this.renderUMLDiagram();
            this.syncMaximizedControls();
        } catch (err) {
            this.snapshots = [];
            this.dom.statusIcon.textContent = '❌';
            this.dom.statusText.textContent = `שגיאת הידור / מפרש: ${err.message}`;
            this.dom.statusBanner.className = 'status-banner danger';
            this.syncMaximizedControls();
        }
    }

    stepNext() {
        if (this.currentStep < this.snapshots.length - 1) {
            this.currentStep++;
            this.renderStep(this.currentStep, true);
        } else {
            this.pause();
        }
    }

    stepPrev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep(this.currentStep, true);
        }
    }

    resetRun() {
        this.pause();
        this._hasPromptedModalForRun = false;
        this.currentStep = 0;
        this.renderStep(0, true);
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
        this.dom.btnPlay.innerHTML = '<span>⏸️</span><span>השהה</span>';
        this.dom.btnPlay.classList.remove('btn-ctrl-primary');
        this.dom.btnPlay.classList.add('btn-ctrl-secondary');
        this.syncMaximizedControls();
        this.runLoop();
    }

    pause() {
        this.isPlaying = false;
        if (this.playTimer) clearTimeout(this.playTimer);
        this.dom.btnPlay.innerHTML = '<span>▶️</span><span>נגן</span>';
        this.dom.btnPlay.classList.remove('btn-ctrl-secondary');
        this.dom.btnPlay.classList.add('btn-ctrl-primary');
        this.syncMaximizedControls();
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

    toggleMaximizeMemoryStage(force = null) {
        const stageCard = document.querySelector('.memory-stage-card');
        if (!stageCard) return;
        const isMax = (force !== null) ? force : !stageCard.classList.contains('is-maximized');
        stageCard.classList.toggle('is-maximized', isMax);

        if (this.dom.btnMaximizeMemoryStage) {
            this.dom.btnMaximizeMemoryStage.textContent = isMax ? '🗗' : '⛶';
            this.dom.btnMaximizeMemoryStage.title = isMax ? 'שחזר גודל במת אנימציה' : 'מקסם במת אנימציה';
        }

        if (this.dom.maxFloatingControls) {
            this.dom.maxFloatingControls.style.display = isMax ? 'flex' : 'none';
        }

        this.syncMaximizedControls();
    }

    syncMaximizedControls() {
        if (!this.snapshots || this.snapshots.length === 0) {
            if (this.dom.maxStepCounter) this.dom.maxStepCounter.textContent = 'צעד 0 / 0';
            if (this.dom.maxStatusDesc) this.dom.maxStatusDesc.textContent = this.dom.statusText ? this.dom.statusText.textContent : 'אין צעדים';
            return;
        }
        const snap = this.snapshots[this.currentStep] || {};

        if (this.dom.maxStepCounter) {
            this.dom.maxStepCounter.textContent = `צעד ${this.currentStep + 1} / ${this.snapshots.length}`;
        }
        if (this.dom.maxStatusDesc) {
            this.dom.maxStatusDesc.textContent = snap.desc || '';
        }
        if (this.dom.maxBtnPlay) {
            this.dom.maxBtnPlay.innerHTML = this.isPlaying ? '<span>⏸️</span><span>השהה</span>' : '<span>▶️</span><span>נגן</span>';
        }
    }

    hasSingleInput() {
        if (!this.snapshots || this.snapshots.length === 0) return false;
        const uniqueInputs = new Set();
        for (const s of this.snapshots) {
            if (s.isInputStep && s.inputEvent) {
                const key = s.inputEvent.index !== undefined ? s.inputEvent.index : s.inputEvent;
                uniqueInputs.add(key);
            }
        }
        if (uniqueInputs.size > 0) {
            return uniqueInputs.size === 1;
        }
        const inputSnaps = this.snapshots.filter(s => s.isInputStep);
        return inputSnaps.length === 1;
    }

    openSingleInputModal(stepSnapshot = null) {
        if (!this.dom.singleInputModal) return;
        const snap = stepSnapshot || this.snapshots[this.currentStep] || {};
        const inputEvent = snap.inputEvent || {};
        const targetVar = snap.targetVar || inputEvent.target || 'קלט';
        const type = inputEvent.type || 'string';

        let currentVal = this._lastSingleInput;
        if (currentVal === undefined || currentVal === null || currentVal === 'undefined' || currentVal === 'null') {
            const tableVal = this.inputTableManager?.inputs?.[0]?.value ?? this.inputTableManager?.inputs?.[0]?.val;
            if (tableVal !== undefined && tableVal !== null && tableVal !== 'undefined' && tableVal !== 'null') {
                currentVal = tableVal;
            } else if (inputEvent.rawVal && inputEvent.rawVal !== 'undefined' && inputEvent.rawVal !== 'null') {
                currentVal = inputEvent.rawVal;
            } else {
                currentVal = '';
            }
        }

        if (this.dom.singleInputInstruction) {
            this.dom.singleInputInstruction.textContent = `התוכנית ממתינה לקלט מהמשתמש. הזן ערך עבור המשתנה '${targetVar}' (מטיפוס ${type}):`;
        }
        if (this.dom.singleInputCmd) {
            this.dom.singleInputCmd.textContent = snap.activeLineText || 'Console.ReadLine()';
        }
        if (this.dom.singleInputType) {
            this.dom.singleInputType.textContent = type;
        }
        if (this.dom.singleInputField) {
            this.dom.singleInputField.value = currentVal;
            this.dom.singleInputField.dataset.type = type;
            this.dom.singleInputField.dataset.target = targetVar;
            this.dom.singleInputField.placeholder = type === 'int' ? 'לדוגמה: 42' : (type === 'double' ? 'לדוגמה: 3.14' : 'הזן ערך...');
        }
        if (this.dom.singleInputError) {
            this.dom.singleInputError.style.display = 'none';
            this.dom.singleInputError.textContent = '';
        }
        this.dom.singleInputModal.style.display = 'flex';
        setTimeout(() => {
            if (this.dom.singleInputField) {
                this.dom.singleInputField.focus();
                this.dom.singleInputField.select();
            }
        }, 50);
    }

    closeSingleInputModal() {
        if (this.dom.singleInputModal) {
            this.dom.singleInputModal.style.display = 'none';
        }
    }

    confirmSingleInput() {
        if (!this.dom.singleInputField) return;
        const rawVal = this.dom.singleInputField.value;
        const type = this.dom.singleInputField.dataset.type || 'string';
        const targetVar = this.dom.singleInputField.dataset.target || 'קלט';

        // בדיקת תקינות מקדימה במודאל
        if (type === 'int') {
            if (!/^-?\d+$/.test(rawVal.trim())) {
                this.showSingleInputError(`שגיאת המרה: הערך "${rawVal}" אינו מספר שלם (int) תקין!`);
                return;
            }
        } else if (type === 'double' || type === 'float') {
            if (isNaN(parseFloat(rawVal.trim()))) {
                this.showSingleInputError(`שגיאת המרה: הערך "${rawVal}" אינו מספר עשרוני (double) תקין!`);
                return;
            }
        } else if (type === 'bool') {
            const low = rawVal.trim().toLowerCase();
            if (low !== 'true' && low !== 'false') {
                this.showSingleInputError(`שגיאת המרה: הערך "${rawVal}" אינו ערך בוליאני תקין (true / false)!`);
                return;
            }
        } else if (type === 'char') {
            if (rawVal.trim().length !== 1) {
                this.showSingleInputError(`שגיאת המרה: הערך "${rawVal}" אינו תו בודד (char)!`);
                return;
            }
        }

        const cleanVal = type === 'string' ? rawVal : rawVal.trim();
        this._lastSingleInput = cleanVal;

        if (this.inputTableManager) {
            const rowObj = {
                id: 1,
                value: cleanVal,
                val: cleanVal,
                type: type,
                note: targetVar || 'קלט יחיד',
                status: 'pending'
            };
            if (typeof this.inputTableManager.setValues === 'function') {
                this.inputTableManager.setValues([rowObj]);
            } else {
                this.inputTableManager.inputs = [rowObj];
                if (typeof this.inputTableManager.render === 'function') {
                    this.inputTableManager.render();
                }
            }
        }

        this.closeSingleInputModal();
        this._hasPromptedModalForRun = true;

        const wasPlaying = this._wasPlayingBeforeModal || this.isPlaying;
        this.recompile(true);

        // מקדמים את הדיבאגר לצעד שלאחר הקלט כדי שהמשתמש יראה מיידית את הערך שנקלט
        if (this.snapshots && this.snapshots.length > 0) {
            const inputStepIdx = this.snapshots.findIndex(s => s.isInputStep);
            if (inputStepIdx !== -1) {
                const targetStep = Math.min(this.snapshots.length - 1, inputStepIdx + 1);
                this.currentStep = targetStep;
                this.renderStep(targetStep, true);
            }
        }

        if (wasPlaying) {
            this._wasPlayingBeforeModal = false;
            this.play();
        }
    }

    showSingleInputError(msg) {
        if (this.dom.singleInputError) {
            this.dom.singleInputError.textContent = msg;
            this.dom.singleInputError.style.display = 'block';
        }
    }

    /**
     * רינדור מלא של מצב הצעד הנוכחי בדיבאגר
     */
    renderStep(stepIdx, allowTabSwitch = true) {
        if (!this.snapshots || this.snapshots.length === 0) return;
        const snap = this.snapshots[stepIdx];

        // 1. מונה צעדים וסטטוס
        this.dom.stepCounter.textContent = `צעד ${stepIdx + 1} / ${this.snapshots.length}`;
        this.dom.statusIcon.textContent = snap.action === 'dynamic_dispatch' ? '⚡' : snap.action === 'error' ? '❌' : '💡';
        this.dom.statusText.textContent = snap.desc;
        this.dom.statusBanner.className = `status-banner ${snap.action === 'error' ? 'danger' : snap.action === 'dynamic_dispatch' ? 'warning' : 'info'}`;

        // 2. סנכרון עורך הקוד והדגשת שורה
        if (allowTabSwitch && snap.file && snap.file !== this.activeFilename && this.files[snap.file]) {
            this.activeFilename = snap.file;
            this.renderFileTabs();
            this.loadActiveFileContent();
        }
        if (snap.file === this.activeFilename) {
            this.updateHighlighter(snap.line, Boolean(snap.isInputStep));
        } else {
            this.updateHighlighter(null, false);
        }

        // 3. עדכון טבלת קלט נתונים
        if (this.inputTableManager) {
            this.inputTableManager.updateStep(snap);
        }

        // 4. רינדור רפרנסים במחסנית (Stack)
        this.renderStack(snap.stack, snap);

        // 5. רינדור אובייקטים קונצנטריים בערימה (Russian-Doll Blobs in Heap)
        this.renderHeap(snap.heap, snap);

        // 6. ציור חיצי הצבעה מ-Stack ל-Heap
        setTimeout(() => this.drawReferenceArrows(), 30);

        // 7. טבלת מעקב משתנים
        this.renderWatchTable(snap.stack);

        // 8. מחסנית קריאות (Call Stack)
        this.renderCallStack(snap.callStack);

        // 9. מסוף פלט (Console Output)
        this.renderConsole(snap.console);

        // 10. סנכרון סרגל בקרה צף במצב מקסום
        this.syncMaximizedControls();

        // 11. פופ-אפ קלט ידידותי עבור Console.ReadLine במידה ומדובר בפקודת קלט בודדת
        if (snap.isInputStep && this.hasSingleInput() && !this._hasPromptedModalForRun) {
            const wasPlaying = this.isPlaying;
            if (this.isPlaying) this.pause();
            this._wasPlayingBeforeModal = wasPlaying;
            this.openSingleInputModal(snap);
            this._hasPromptedModalForRun = true;
        }
    }

    renderStack(stack, snap) {
        if (!this.dom.stackList) return;
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
