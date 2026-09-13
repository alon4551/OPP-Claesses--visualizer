/**
 * מרכז מדעי המחשב — מקיף דוד טוביהו | אלון שרייבמן
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

        this.initKeywords();
        this.attachEvents();
    }

    initKeywords() {
        this.items = [
            {
                label: 'base',
                insert: 'base',
                kind: 'keyword',
                detail: 'קריאה למחלקת הבסיס (Base)',
                doc: 'פנייה לאלמנטים במחלקת האב: שרשור פעולה בונה base(args) או זימון פעולה base.Method(). כלל בגרות: שרשור בנאי חייב להתבצע ראשון בכותרת הפעולה הבונה.'
            },
            {
                label: 'this',
                insert: 'this.',
                kind: 'keyword',
                detail: 'הפניה לאובייקט הנוכחי',
                doc: 'פנייה לשדות או פעולות של האובייקט הנוכחי. שימושי להבחנה בין שדה מחלקה לפרמטר בנאי (this.name = name;).'
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
                label: 'protected',
                insert: 'protected ',
                kind: 'keyword',
                detail: 'רמת כימוס מוגנת (ירושה)',
                doc: 'שדה או פעולה נגישים בתוך המחלקה ובכל המחלקות הנגזרות ממנה, אך מוסתרים לחלוטין מחוץ להיררכיה (private כלפי חוץ, public כלפי פנים).'
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
            }
        ];
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
        const match = text.match(/([A-Za-z0-9_.:]+)$/);

        if (match && match[1].length >= 1) {
            this.open(false, match[1]);
        } else {
            this.close();
        }
    }

    open(forced = false, query = '') {
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
    }

    renderList() {
        this.listElem.innerHTML = '';
        this.suggestions.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = `autocomplete-item ${idx === this.selectedIndex ? 'selected' : ''}`;
            row.innerHTML = `
                <div class="item-main">
                    <span class="item-kind badge-kind-${item.kind}">${item.kind === 'snippet' ? '⚡' : item.kind === 'method' ? '🔧' : '🗝️'}</span>
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
        const match = textBefore.match(/([A-Za-z0-9_.:]+)$/);
        const wordLen = match ? match[1].length : 0;

        const startPos = cursor - wordLen;
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
