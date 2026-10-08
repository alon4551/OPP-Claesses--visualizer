/**
 * אלון שרייבמן — מורה פרטי
 * מנוע השלמה אוטומטית ותיעוד פדגוגי ל-OOP והורשה ב-C# (IntelliSense)
 */

class AutocompleteEngine {
    constructor(textarea, popupElem, onApplyCallback) {
        this.textarea = textarea;
        this.popup = popupElem;
        this.listElem = popupElem.querySelector('.autocomplete-list') || popupElem;
        this.docElem = popupElem.querySelector('.autocomplete-doc');
        this.onApply = onApplyCallback || (() => {});
        this.selectedIndex = 0;
        this.suggestions = [];
        this.isOpen = false;

        this.currentLang = 'csharp';
        this.initKeywords(this.currentLang);
        this.attachEvents();
    }

    setLanguage(lang) {
        this.currentLang = lang || 'csharp';
        this.initKeywords(this.currentLang);
    }

    initKeywords(lang = 'csharp') {
        const commonItems = [
            {
                label: 'this',
                insert: 'this.',
                kind: 'keyword',
                detail: 'הפניה לאובייקט הנוכחי',
                doc: 'פנייה לשדות או פעולות של האובייקט הנוכחי. שימושי להבחנה בין שדה מחלקה לפרמטר בנאי (this.name = name;).'
            },
            {
                label: 'protected',
                insert: 'protected ',
                kind: 'keyword',
                detail: 'רמת כימוס מוגנת (ירושה)',
                doc: 'שדה או פעולה נגישים בתוך המחלקה ובכל המחלקות הנגזרות ממנה, אך מוסתרים לחלוטין מחוץ להיררכיה.'
            },
            {
                label: 'public',
                insert: 'public ',
                kind: 'keyword',
                detail: 'רמת כימוס ציבורית',
                doc: 'אלמנט נגיש מכל מקום בתוכנית. פעולות בונות ומתודות בסיסיות מוגדרות לרוב כ-public.'
            },
            {
                label: 'private',
                insert: 'private ',
                kind: 'keyword',
                detail: 'רמת כימוס פרטית (הסתרה מלאה)',
                doc: 'שדה או פעולה הנגישים אך ורק מתוך אותה מחלקה שבה הוגדרו. שדות private אינם נגישים ישירות אפילו במחלקה הנגזרת!'
            },
            {
                label: 'class',
                insert: 'public class ${name}\n{\n    \n}',
                kind: 'snippet',
                detail: 'תבנית מחלקה חדשה',
                doc: 'מגדיר טיפוס נתונים חדש הכולל שדות, בנאים ומתודות.'
            }
        ];

        if (lang === 'java') {
            this.items = [
                ...commonItems,
                {
                    label: 'extends',
                    insert: 'extends ',
                    kind: 'keyword',
                    detail: 'הורשה ב-Java (הרחבת מחלקה)',
                    doc: 'מגדיר שמחלקה נגזרת יורשת ממחלקת אב: public class B extends A.'
                },
                {
                    label: 'super',
                    insert: 'super',
                    kind: 'keyword',
                    detail: 'קריאה למחלקת העל (Superclass)',
                    doc: 'פנייה לאלמנטים במחלקת האב: שרשור פעולה בונה super(args); כשורה ראשונה בבנאי, או זימון פעולת אב super.method().'
                },
                {
                    label: '@Override',
                    insert: '@Override\n',
                    kind: 'keyword',
                    detail: 'אנוטציית דריסת פעולה',
                    doc: 'מציין במפורש שהפעולה דורסת פעולה בעלת חתימה זהה ממחלקת האב. בג\'אווה כל פעולות המופע הן וירטואליות כברירת מחדל.'
                },
                {
                    label: 'System.out.println',
                    insert: 'System.out.println(${text});',
                    kind: 'method',
                    detail: 'הדפסה למסוף עם ירידת שורה',
                    doc: 'מדפיס ערך או מחרוזת למסוף ופותח שורה חדשה: System.out.println("x = " + x);'
                },
                {
                    label: 'sout',
                    insert: 'System.out.println(${text});',
                    kind: 'snippet',
                    detail: 'קיצור דרך להדפסה למסוף (sout)',
                    doc: 'קיצור דרך פופולרי ב-Java (IntelliJ / Eclipse) לפקודת System.out.println.'
                },
                {
                    label: 'class extends Base',
                    insert: 'public class ${Derived} extends ${Base}\n{\n    public ${Derived}()\n    {\n        super();\n    }\n}',
                    kind: 'snippet',
                    detail: 'תבנית מחלקה נגזרת ב-Java עם super()',
                    doc: 'מחלקה נגזרת ב-Java המרחיבה מחלקת בסיס ומיישמת שרשור בנאי super().'
                },
                {
                    label: 'ctor',
                    insert: 'public ${ClassName}()\n{\n    super();\n}',
                    kind: 'snippet',
                    detail: 'פעולה בונה ב-Java',
                    doc: 'בנאי המאתחל את שדות האובייקט בעת יצירתו ע"י new.'
                },
                {
                    label: 'main',
                    insert: 'public static void main(String[] args)\n{\n    \n}',
                    kind: 'snippet',
                    detail: 'נקודת כניסה ראשית ב-Java',
                    doc: 'הפעולה הראשית שמתחילה את ריצת התוכנית בג\'אווה.'
                },
                {
                    label: 'instanceof',
                    insert: 'instanceof ',
                    kind: 'keyword',
                    detail: 'בדיקת טיפוס בזמן ריצה ב-Java',
                    doc: 'בדיקה האם אובייקט הוא מופע של מחלקה או יורש ממנה: if (obj instanceof Manager).'
                },
                {
                    label: 'toString',
                    insert: '@Override\npublic String toString()\n{\n    return "${ClassName}";\n}',
                    kind: 'method',
                    detail: 'דריסת פעולת toString() ב-Java',
                    doc: 'דריסת הפעולה המובנית ב-Object להצגת ייצוג מחרוזתי קריא של תוכן האובייקט.'
                },
                {
                    label: 'boolean',
                    insert: 'boolean ',
                    kind: 'keyword',
                    detail: 'טיפוס בוליאני ב-Java (true/false)',
                    doc: 'טיפוס פרימיטיבי ב-Java לערכי אמת/שקר. ברירת המחדל היא false.'
                },
                {
                    label: 'String',
                    insert: 'String ',
                    kind: 'keyword',
                    detail: 'טיפוס מחרוזת ב-Java',
                    doc: 'מחלקת מחרוזת מובנית בג\'אווה.'
                }
            ];
        } else {
            // C#
            this.items = [
                ...commonItems,
                {
                    label: 'base',
                    insert: 'base',
                    kind: 'keyword',
                    detail: 'קריאה למחלקת הבסיס (Base)',
                    doc: 'פנייה לאלמנטים במחלקת האב: שרשור פעולה בונה base(args) או זימון פעולה base.Method(). כלל בגרות: שרשור בנאי חייב להתבצע ראשון בכותרת הפעולה הבונה.'
                },
                {
                    label: 'override',
                    insert: 'override ',
                    kind: 'keyword',
                    detail: 'דריסת פעולה פולימורפית',
                    doc: 'מציין מימוש מחדש במחלקה נגזרת לפעולה שהוגדרה כ-virtual במחלקת האב. מאפשר הכרעה דינמית בזמן ריצה (Dynamic Dispatch).'
                },
                {
                    label: 'virtual',
                    insert: 'virtual ',
                    kind: 'keyword',
                    detail: 'פעולה הניתנת לדריסה',
                    doc: 'מגדיר פעולה במחלקת הבסיס שניתן לדרוס אותה במחלקה נגזרת ע"י override. אם המחלקה הנגזרת לא תדרוס, יופעל מימוש ברירת המחדל.'
                },
                {
                    label: 'class : base',
                    insert: 'public class ${Derived} : ${Base}\n{\n    public ${Derived}() : base()\n    {\n        \n    }\n}',
                    kind: 'snippet',
                    detail: 'תבנית מחלקה נגזרת עם שרשור בנאי',
                    doc: 'מחלקה נגזרת המרחיבה מחלקת בסיס. מיישמת שרשור בנאי קבוע : base().'
                },
                {
                    label: 'ctor',
                    insert: 'public ${ClassName}()\n{\n    \n}',
                    kind: 'snippet',
                    detail: 'פעולה בונה (Constructor)',
                    doc: 'בנאי המאתחל את שדות האובייקט בעת יצירתו ע"י new.'
                },
                {
                    label: 'Console.WriteLine',
                    insert: 'Console.WriteLine(${text});',
                    kind: 'method',
                    detail: 'הדפסה למסוף עם ירידת שורה',
                    doc: 'מדפיס ערך או מחרוזת למסוף ופותח שורה חדשה. תומך באינטרפולציה: Console.WriteLine($"x={x}");'
                },
                {
                    label: 'ToString',
                    insert: 'public override string ToString()\n{\n    return $"${ClassName}";\n}',
                    kind: 'method',
                    detail: 'דריסת פעולת ToString()',
                    doc: 'דריסת הפעולה המובנית ב-object להצגת ייצוג מחרוזתי קריא של תוכן האובייקט.'
                },
                {
                    label: 'is',
                    insert: 'is ',
                    kind: 'keyword',
                    detail: 'בדיקת טיפוס בזמן ריצה',
                    doc: 'בדיקה האם אובייקט הוא מטיפוס מסוים או יורש ממנו: if (emp is Manager).'
                },
                {
                    label: 'as',
                    insert: 'as ',
                    kind: 'keyword',
                    detail: 'המרה בטוחה של טיפוס',
                    doc: 'המרה של הפניה לטיפוס נגזר. אם ההמרה נכשלת, מוחזר null ללא קריסת התוכנית.'
                },
                {
                    label: 'bool',
                    insert: 'bool ',
                    kind: 'keyword',
                    detail: 'טיפוס בוליאני ב-C# (true/false)',
                    doc: 'טיפוס פרימיטיבי ב-C# לערכי אמת/שקר.'
                },
                {
                    label: 'string',
                    insert: 'string ',
                    kind: 'keyword',
                    detail: 'טיפוס מחרוזת ב-C#',
                    doc: 'מחרוזת טקסטואלית ב-C#.'
                }
            ];
        }
    }

    attachEvents() {
        this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.textarea.addEventListener('input', () => this.handleInput());
        document.addEventListener('click', (e) => {
            if (!this.popup.contains(e.target) && e.target !== this.textarea) {
                this.close();
            }
        });
    }

    setClassProvider(providerFn) {
        this.classProvider = providerFn;
    }

    /**
     * חילוץ מחלקות, פעולות ושדות מתוך קבצי הפרויקט
     */
    extractClasses() {
        if (!this.classProvider) return {};
        const data = this.classProvider();
        if (data && data.classes && Object.keys(data.classes).length > 0) {
            return data.classes;
        }
        const files = (data && data.files) ? data.files : {};
        const extracted = {};

        for (const [fname, code] of Object.entries(files)) {
            const classRegex = /(?:public\s+|abstract\s+)?class\s+([A-Za-z0-9_]+)(?:\s*(?::|extends)\s*([A-Za-z0-9_]+))?\s*\{([\s\S]*?)\}(?=\s*(?:public\s+|abstract\s+)?class|$)/g;
            let m;
            while ((m = classRegex.exec(code)) !== null) {
                const cName = m[1];
                const baseName = m[2] || null;
                const body = m[3];
                const cls = {
                    name: cName,
                    baseClass: baseName,
                    filename: fname,
                    methods: {},
                    fields: [],
                    constructors: []
                };

                const methRegex = /(?:public|protected|private)?\s*(?:static\s+)?(?:virtual\s+|override\s+)?([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g;
                let mm;
                while ((mm = methRegex.exec(body)) !== null) {
                    const retType = mm[1];
                    const mName = mm[2];
                    const rawParams = mm[3].trim();
                    if (mName === cName) {
                        cls.constructors.push({ params: rawParams });
                        continue;
                    }
                    if (['if', 'while', 'for', 'switch', 'catch'].includes(mName)) continue;
                    cls.methods[mName] = {
                        name: mName,
                        returnType: retType,
                        params: rawParams ? rawParams.split(',').map(p => p.trim()) : [],
                        originClass: cName
                    };
                }

                const fieldRegex = /(?:public|protected)\s+([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+)\s*(?:=|;)/g;
                let fm;
                while ((fm = fieldRegex.exec(body)) !== null) {
                    cls.fields.push({
                        type: fm[1],
                        name: fm[2],
                        originClass: cName
                    });
                }
                extracted[cName] = cls;
            }
        }
        return extracted;
    }

    /**
     * מזהה את טיפוס המשתנה מתוך הקוד
     */
    inferVariableType(varName, codeBeforeCursor) {
        if (!varName) return null;
        if (varName === 'this') {
            const m = codeBeforeCursor.match(/class\s+([A-Za-z0-9_]+)/g);
            return m ? m[m.length - 1].replace('class', '').trim() : null;
        }

        const lines = codeBeforeCursor.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            const declMatch = line.match(new RegExp(`(?:^|[\\s(,;])([A-Za-z0-9_<>]+)\\s+${varName}\\s*(?:=|[;,\\)])`));
            if (declMatch && !['public', 'private', 'protected', 'return', 'else', 'case', 'if', 'while', 'for'].includes(declMatch[1])) {
                let foundType = declMatch[1];
                if (foundType === 'var') {
                    const newMatch = line.match(new RegExp(`${varName}\\s*=\\s*new\\s+([A-Za-z0-9_]+)`));
                    if (newMatch) return newMatch[1];
                }
                return foundType;
            }
            const assignNewMatch = line.match(new RegExp(`${varName}\\s*=\\s*new\\s+([A-Za-z0-9_]+)`));
            if (assignNewMatch) {
                return assignNewMatch[1];
            }
        }
        return null;
    }

    /**
     * איסוף ממשק מחלקה מלא כולל הורשה
     */
    getClassInterfaceItems(className, allClasses) {
        const items = [];
        const seenMethods = new Set();
        const seenFields = new Set();

        let currName = className;
        let depth = 0;
        while (currName && depth < 10) {
            const cls = allClasses[currName];
            if (!cls) break;

            const methods = cls.methods ? Object.values(cls.methods) : [];
            for (const m of methods) {
                if (m.access && m.access === 'private') continue;
                if (!seenMethods.has(m.name)) {
                    seenMethods.add(m.name);
                    const paramStr = Array.isArray(m.params)
                        ? m.params.map(p => (typeof p === 'object' ? `${p.type || ''} ${p.name || ''}`.trim() : String(p))).join(', ')
                        : '';
                    const returnType = m.returnType || 'void';
                    items.push({
                        label: `${m.name}(${paramStr})`,
                        insert: `${m.name}(${paramStr ? '' : ''})`,
                        kind: 'method',
                        detail: `${returnType} — מוגדר ב-${m.originClass || currName}`,
                        doc: `פעולה במחלקה ${m.originClass || currName}. חתימה: ${returnType} ${m.name}(${paramStr}).`
                    });
                }
            }

            const fields = cls.fields || [];
            for (const f of fields) {
                if (f.access && f.access === 'private') continue;
                if (!seenFields.has(f.name)) {
                    seenFields.add(f.name);
                    items.push({
                        label: f.name,
                        insert: f.name,
                        kind: 'field',
                        detail: `${f.type || 'field'} — שדה ב-${f.originClass || currName}`,
                        doc: `שדה מטיפוס ${f.type || 'Object'} במחלקה ${f.originClass || currName}.`
                    });
                }
            }

            currName = cls.baseClass || null;
            depth++;
        }

        if (!seenMethods.has('ToString')) {
            items.push({
                label: 'ToString()',
                insert: 'ToString()',
                kind: 'method',
                detail: 'string (System.Object)',
                doc: 'מחזיר ייצוג מחרוזתי של האובייקט (נדרס ע"י override string ToString()).'
            });
        }
        if (!seenMethods.has('Equals')) {
            items.push({
                label: 'Equals(object obj)',
                insert: 'Equals()',
                kind: 'method',
                detail: 'bool (System.Object)',
                doc: 'בדיקת שוויון לוגי בין אובייקטים.'
            });
        }

        return items;
    }

    handleKeyDown(e) {
        if (!this.isOpen) {
            // קיצור Ctrl+Space לפתיחה יזומה
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.open(true);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
            this.renderList();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
            this.renderList();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            this.applySelection();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    handleInput() {
        const cursor = this.textarea.selectionStart;
        const text = this.textarea.value.slice(0, cursor);

        // 1. בדיקת גישה לאיבר באמצעות נקודה: obj. או obj.member
        const dotMatch = text.match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]*)$/);
        if (dotMatch) {
            const varName = dotMatch[1];
            const memberQuery = dotMatch[2] || '';
            const allClasses = this.extractClasses();
            const varType = this.inferVariableType(varName, text);

            if (varType && (allClasses[varType] || varType === 'this')) {
                const targetClass = (varType === 'this')
                    ? (this.inferVariableType('this', text) || Object.keys(allClasses)[0])
                    : varType;
                const classItems = this.getClassInterfaceItems(targetClass, allClasses);
                this.openWithCustomItems(classItems, memberQuery, memberQuery.length);
                return;
            } else if (allClasses[varName]) {
                // גישה לפעולות סטטיות של המחלקה: ClassName.
                const classItems = this.getClassInterfaceItems(varName, allClasses);
                this.openWithCustomItems(classItems, memberQuery, memberQuery.length);
                return;
            }
        }

        // 2. בדיקת יצירת אובייקט חדש: new ...
        const newMatch = text.match(/\bnew\s+([A-Za-z0-9_]*)$/);
        if (newMatch) {
            const query = newMatch[1] || '';
            const allClasses = this.extractClasses();
            const ctorItems = [];
            for (const [cName, cDef] of Object.entries(allClasses)) {
                if (cName === 'Program' || cName === 'Main') continue;
                ctorItems.push({
                    label: `new ${cName}()`,
                    insert: `${cName}()`,
                    kind: 'snippet',
                    detail: `יצירת מופע חדש של ${cName}`,
                    doc: `יוצר אובייקט חדש בערימה (Heap) מסוג המחלקה ${cName} ומפעיל את הבנאי.`
                });
            }
            if (ctorItems.length > 0) {
                this.openWithCustomItems(ctorItems, query, query.length);
                return;
            }
        }

        // 3. מילות מפתח ותבניות ברירת מחדל
        const match = text.match(/([A-Za-z0-9_]+)$/);
        if (match && match[1].length >= 2) {
            this.customReplaceLen = match[1].length;
            this.open(false, match[1]);
        } else {
            this.close();
        }
    }

    openWithCustomItems(customItems, query = '', replaceLen = 0) {
        this.customReplaceLen = replaceLen;
        const lowerQ = (query || '').toLowerCase();
        this.suggestions = customItems.filter(item => {
            if (!query) return true;
            return item.label.toLowerCase().includes(lowerQ) || (item.insert && item.insert.toLowerCase().includes(lowerQ));
        });

        if (this.suggestions.length === 0) {
            this.close();
            return;
        }

        this.selectedIndex = 0;
        this.isOpen = true;
        this.popup.style.display = 'flex';
        this.renderList();
    }

    open(forced = false, query = '') {
        this.customReplaceLen = query ? query.length : 0;
        const lowerQ = query.toLowerCase();
        this.suggestions = this.items.filter(item => {
            if (!query) return true;
            return item.label.toLowerCase().includes(lowerQ) || (item.insert && item.insert.toLowerCase().includes(lowerQ));
        });

        if (this.suggestions.length === 0) {
            this.close();
            return;
        }

        this.selectedIndex = 0;
        this.isOpen = true;
        this.popup.style.display = 'flex';
        this.renderList();
    }

    close() {
        this.isOpen = false;
        this.popup.style.display = 'none';
        this.customReplaceLen = null;
    }

    renderList() {
        this.listElem.innerHTML = '';
        this.suggestions.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = `autocomplete-item ${idx === this.selectedIndex ? 'selected' : ''}`;
            row.innerHTML = `
                <div class="item-main">
                    <span class="item-kind badge-kind-${item.kind}">${item.kind === 'snippet' ? '⚡' : item.kind === 'method' ? '🔧' : item.kind === 'field' ? '📦' : '🗝️'}</span>
                    <span class="item-label">${item.label}</span>
                </div>
                <div class="item-detail">${item.detail}</div>
            `;
            row.addEventListener('click', () => {
                this.selectedIndex = idx;
                this.applySelection();
            });
            this.listElem.appendChild(row);
        });

        const active = this.suggestions[this.selectedIndex];
        if (this.docElem && active) {
            this.docElem.innerHTML = `
                <div class="doc-header">
                    <strong>${active.label}</strong>
                    <span class="badge badge-sm">${active.detail}</span>
                </div>
                <div class="doc-body">${active.doc}</div>
            `;
        }
    }

    applySelection() {
        const item = this.suggestions[this.selectedIndex];
        if (!item) return;

        const cursor = this.textarea.selectionStart;
        const textBefore = this.textarea.value.slice(0, cursor);
        const match = textBefore.match(/([A-Za-z0-9_]+)$/);
        const replaceLen = (this.customReplaceLen !== null && this.customReplaceLen !== undefined)
            ? this.customReplaceLen
            : (match ? match[1].length : 0);

        const startPos = cursor - replaceLen;
        const endPos = cursor;

        let insertText = item.insert.replace(/\$\{[^}]+\}/g, '');
        const fullText = this.textarea.value;
        this.textarea.value = fullText.slice(0, startPos) + insertText + fullText.slice(endPos);

        const newCursor = startPos + insertText.length;
        this.textarea.selectionStart = newCursor;
        this.textarea.selectionEnd = newCursor;
        this.textarea.focus();

        this.close();
        this.onApply();
    }
}

if (typeof window !== 'undefined') {
    window.AutocompleteEngine = AutocompleteEngine;
}
