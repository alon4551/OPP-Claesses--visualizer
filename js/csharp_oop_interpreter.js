/**
 * מרכז מדעי המחשב — מקיף דוד טוביהו | אלון שרייבמן
 * מפרש C# מונחה עצמים והורשה (C# OOP & Inheritance Interpreter)
 * תומך בריבוי קבצים/מחלקות, שרשור בנאים (base), פולימורפיזם (virtual/override),
 * מערכים הטרוגניים, מחסנית וערימה (Stack & Heap), והפשטה ויזואלית של שכבות קונצנטריות.
 */

class CSharpOOPInterpreter {
    constructor() {
        this.classes = {};      // שם מחלקה -> אובייקט הגדרת מחלקה
        this.entryClass = 'Program';
        this.entryMethod = 'Main';
        this.maxSteps = 1500;
        this.snapshots = [];
        this.heapCounter = 1;
    }

    /**
     * מקבל מילון קבצים: { 'Program.cs': '...', 'A.cs': '...', ... }
     * ומנתח את כל המחלקות והפעולות.
     */
    parseFiles(files) {
        this.classes = {};
        this.fileLines = {};
        
        for (const [filename, content] of Object.entries(files)) {
            this.fileLines[filename] = content.split('\n');
            this.parseSingleFile(filename, content);
        }

        // בדיקת קשרי ירושה והשלמת שרשראות
        this.resolveInheritance();
    }

    parseSingleFile(filename, content) {
        // ניקוי הערות שורה והערות בלוק תוך שמירה על מספרי שורות
        const cleanContent = this.stripCommentsPreservingLines(content);
        const lines = cleanContent.split('\n');

        let currentClass = null;
        let braceDepth = 0;
        let classStartDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const trimmed = rawLine.trim();
            const lineNum = i + 1;

            if (!trimmed) continue;

            // בדיקת הגדרת מחלקה: [public/abstract/internal] class ClassName [: BaseClass / extends BaseClass]
            const classMatch = trimmed.match(/(?:public\s+|abstract\s+|internal\s+)*class\s+([A-Za-z0-9_]+)(?:\s*(?::|extends)\s*([A-Za-z0-9_]+))?/);
            if (classMatch && !currentClass) {
                const className = classMatch[1];
                const baseClass = classMatch[2] || null;
                const isAbstract = trimmed.includes('abstract class');

                currentClass = {
                    name: className,
                    baseClass: baseClass,
                    isAbstract: isAbstract,
                    filename: filename,
                    startLine: lineNum,
                    fields: [],          // { name, type, access, defaultValue, line }
                    constructors: [],    // { params, baseArgs, body, line }
                    methods: {},         // name -> { params, returnType, access, isVirtual, isOverride, isStatic, body, line }
                    hierarchy: [className] // יושלם ב-resolveInheritance
                };
                this.classes[className] = currentClass;
                classStartDepth = braceDepth;
                continue;
            }

            // מעקב אחר סוגריים מסולסלים
            const openBraces = (trimmed.match(/{/g) || []).length;
            const closeBraces = (trimmed.match(/}/g) || []).length;
            braceDepth += openBraces - closeBraces;

            if (currentClass && braceDepth <= classStartDepth && closeBraces > 0 && i > 0) {
                currentClass = null;
                continue;
            }

            if (!currentClass) continue;

            // זיהוי שדות: [private/protected/public] [type] [name] [= default];
            const fieldMatch = trimmed.match(/^(private|protected|public)?\s*([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+)\s*(?:=\s*([^;]+))?;$/);
            if (fieldMatch && !trimmed.includes('(')) {
                const access = fieldMatch[1] || 'private';
                const type = fieldMatch[2];
                const name = fieldMatch[3];
                const defaultVal = fieldMatch[4] ? fieldMatch[4].trim() : null;

                currentClass.fields.push({
                    name: name,
                    type: type,
                    access: access,
                    defaultVal: defaultVal,
                    line: lineNum,
                    filename: filename
                });
                continue;
            }

            // זיהוי פעולה בונה (Constructor): [public/protected] ClassName(params) [: base(args) / : this(args)]
            let fullCtorHeader = trimmed;
            if (fullCtorHeader.includes(currentClass.name + '(') || fullCtorHeader.includes(currentClass.name + ' (')) {
                let lookAhead = i + 1;
                while (lookAhead < lines.length) {
                    const nextTrimmed = lines[lookAhead].trim();
                    if (!nextTrimmed) { lookAhead++; continue; }
                    if (nextTrimmed.startsWith(':') || nextTrimmed.startsWith('base(') || nextTrimmed.startsWith('this(')) {
                        fullCtorHeader += ' ' + nextTrimmed;
                    }
                    break;
                }
            }

            const ctorRegex = new RegExp(`^(?:public|protected|private)?\\s*${currentClass.name}\\s*\\(([^)]*)\\)(?:\\s*:\\s*(base|this)\\s*\\(([^)]*)\\))?`);
            const ctorMatch = fullCtorHeader.match(ctorRegex);
            if (ctorMatch) {
                const paramsStr = ctorMatch[1].trim();
                let chainType = ctorMatch[2] || null;
                const chainArgsStr = ctorMatch[3] ? ctorMatch[3].trim() : '';

                const params = this.parseParams(paramsStr);
                let chainArgs = chainArgsStr ? this.splitArgs(chainArgsStr) : [];

                // חילוץ גוף הבנאי
                const bodyLines = this.extractBlockBody(lines, i);

                // תמיכה בשרשור בנאים בסגנון Java: super(...) או this(...) בשורה הראשונה של גוף הבנאי
                if (!chainType && bodyLines.lines.length > 0) {
                    for (let bIdx = 0; bIdx < bodyLines.lines.length; bIdx++) {
                        const bText = bodyLines.lines[bIdx].text.trim();
                        if (!bText || bText === '{' || bText.startsWith('//')) continue;
                        const superMatch = bText.match(/^super\s*\((.*)\)\s*;?$/);
                        if (superMatch) {
                            chainType = 'base';
                            chainArgs = this.splitArgs(superMatch[1]);
                            bodyLines.lines[bIdx] = { text: '// ' + bText, lineNum: bodyLines.lines[bIdx].lineNum };
                            break;
                        }
                        const thisMatch = bText.match(/^this\s*\((.*)\)\s*;?$/);
                        if (thisMatch) {
                            chainType = 'this';
                            chainArgs = this.splitArgs(thisMatch[1]);
                            bodyLines.lines[bIdx] = { text: '// ' + bText, lineNum: bodyLines.lines[bIdx].lineNum };
                            break;
                        }
                        break;
                    }
                }

                // אם לא צוין שרשור מפורש אך קיימת מחלקת אב, מתבצע זימון מרומז של בנאי האב הריק (Default super())
                if (!chainType && currentClass.baseClass) {
                    chainType = 'base';
                    chainArgs = [];
                }

                currentClass.constructors.push({
                    params: params,
                    chainType: chainType,
                    chainArgs: chainArgs,
                    bodyLines: bodyLines.lines,
                    startLine: lineNum,
                    endLine: bodyLines.endLine,
                    filename: filename
                });
                continue;
            }

            // זיהוי מתודות: [public/protected/private] [static] [virtual/override/new/abstract] [returnType] MethodName(params)
            // תמיכה גם באנוטציית @Override (בג'אווה) או שורה קודמת עם @Override
            const hasOverrideAnnotation = (i > 0 && lines[i - 1].trim().toLowerCase() === '@override') || trimmed.toLowerCase().startsWith('@override');
            const cleanMethodLine = trimmed.replace(/^@Override\s+/i, '');

            const methodMatch = cleanMethodLine.match(/^(?:(public|protected|private)\s+)?(?:(static)\s+)?(?:(virtual|override|new|abstract)\s+)?([A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/);
            if (methodMatch && methodMatch[5] !== currentClass.name) {
                const access = methodMatch[1] || 'public';
                const isStatic = !!methodMatch[2];
                const modifier = methodMatch[3] || (hasOverrideAnnotation ? 'override' : 'normal');
                const returnType = methodMatch[4];
                const methodName = methodMatch[5];
                const paramsStr = methodMatch[6].trim();

                const params = this.parseParams(paramsStr);
                const isAbstract = modifier === 'abstract' || (!trimmed.includes('{') && trimmed.endsWith(';'));
                const bodyLines = isAbstract ? { lines: [], endLine: lineNum } : this.extractBlockBody(lines, i);

                currentClass.methods[methodName] = {
                    name: methodName,
                    access: access,
                    isStatic: isStatic,
                    isVirtual: modifier === 'virtual' || !isStatic, // בג'אווה כל פעולת מופע היא וירטואלית כברירת מחדל
                    isOverride: modifier === 'override' || hasOverrideAnnotation,
                    isAbstract: modifier === 'abstract',
                    modifier: modifier,
                    returnType: returnType,
                    params: params,
                    bodyLines: bodyLines.lines,
                    startLine: lineNum,
                    endLine: bodyLines.endLine,
                    filename: filename,
                    declaringClass: currentClass.name
                };
            }
        }
    }

    stripCommentsPreservingLines(text) {
        let inBlockComment = false;
        const lines = text.split('\n');
        const out = [];

        for (let line of lines) {
            let processed = '';
            for (let i = 0; i < line.length; i++) {
                if (!inBlockComment && line[i] === '/' && line[i + 1] === '/') {
                    break; // שאר השורה היא הערה
                } else if (!inBlockComment && line[i] === '/' && line[i + 1] === '*') {
                    inBlockComment = true;
                    i++;
                } else if (inBlockComment && line[i] === '*' && line[i + 1] === '/') {
                    inBlockComment = false;
                    i++;
                } else if (!inBlockComment) {
                    processed += line[i];
                } else {
                    processed += ' ';
                }
            }
            out.push(processed);
        }
        return out.join('\n');
    }

    parseParams(paramsStr) {
        if (!paramsStr || !paramsStr.trim()) return [];
        return paramsStr.split(',').map(p => {
            const parts = p.trim().split(/\s+/);
            return {
                type: parts[0] || 'var',
                name: parts[1] || parts[0]
            };
        });
    }

    splitArgs(argsStr) {
        if (!argsStr || !argsStr.trim()) return [];
        const result = [];
        let curr = '';
        let depth = 0;
        let inQuote = false;

        for (let i = 0; i < argsStr.length; i++) {
            const c = argsStr[i];
            if (c === '"' && argsStr[i - 1] !== '\\') inQuote = !inQuote;
            if (!inQuote) {
                if (c === '(' || c === '[' || c === '{') depth++;
                else if (c === ')' || c === ']' || c === '}') depth--;
                else if (c === ',' && depth === 0) {
                    result.push(curr.trim());
                    curr = '';
                    continue;
                }
            }
            curr += c;
        }
        if (curr.trim()) result.push(curr.trim());
        return result;
    }

    extractBlockBody(lines, startIdx) {
        let depth = 0;
        let started = false;
        const bodyLines = [];
        let endLine = startIdx + 1;

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
                const c = line[j];
                if (c === '{') {
                    depth++;
                    started = true;
                } else if (c === '}') {
                    depth--;
                }
            }
            if (started) {
                bodyLines.push({ text: line, lineNum: i + 1 });
            }
            if (started && depth === 0) {
                endLine = i + 1;
                break;
            }
        }
        return { lines: bodyLines, endLine: endLine };
    }

    resolveInheritance() {
        for (const [name, cls] of Object.entries(this.classes)) {
            const hierarchy = [name];
            let curr = cls.baseClass;
            const visited = new Set([name]);

            while (curr && this.classes[curr]) {
                if (visited.has(curr)) break; // מניעת לולאת ירושה
                visited.add(curr);
                hierarchy.unshift(curr); // האב הקדמון ביותר יהיה באינדקס 0
                curr = this.classes[curr].baseClass;
            }
            cls.hierarchy = hierarchy; // למשל: ['A', 'B', 'C']

            // סימון דריסת פעולות (Overriding) עבור Java ו-C# אם קיימת פעולה תואמת במחלקת אב
            for (const [mName, mDef] of Object.entries(cls.methods)) {
                if (mDef.isStatic) continue;
                for (const ancestor of hierarchy) {
                    if (ancestor === name) continue;
                    const ancCls = this.classes[ancestor];
                    if (ancCls) {
                        const ancMethod = ancCls.methods[mName] || Object.values(ancCls.methods).find(am => am.name.toLowerCase() === mName.toLowerCase());
                        if (ancMethod) {
                            ancMethod.isVirtual = true;
                            mDef.isOverride = true;
                            mDef.isVirtual = true;
                        }
                    }
                }
            }
        }
    }

    /**
     * מריץ את התוכנית מנקודת הכניסה (Program.Main או Main.main) ומייצר סנאפשוטים לדיבאגר
     */
    execute(files) {
        this.parseFiles(files);
        this.snapshots = [];
        this.heap = {};          // heapId -> { id, className, hierarchy, layers: { 'A': {...}, 'B': {...} }, isArray, items }
        this.stack = {};         // varName -> { name, type, value, isRef, heapId }
        this.callStack = [];     // [{ name, className, filename, line }]
        this.consoleLines = [];
        this.heapCounter = 101;  // כתובות זיכרון ערימה מדומה (למשל 0x101)

        // איתור מחלקת הכניסה: Program או Main או כל מחלקה המכילה Main() או main()
        let prog = this.classes['Program'] || this.classes['Main'];
        let mainMethod = null;

        if (prog) {
            mainMethod = prog.methods['Main'] || prog.methods['main'] || Object.values(prog.methods).find(m => m.name.toLowerCase() === 'main');
        }

        if (!mainMethod) {
            for (const cls of Object.values(this.classes)) {
                const m = cls.methods['Main'] || cls.methods['main'] || Object.values(cls.methods).find(method => method.name.toLowerCase() === 'main');
                if (m) {
                    prog = cls;
                    mainMethod = m;
                    break;
                }
            }
        }

        if (!prog || !mainMethod) {
            throw new Error("לא נמצאה פעולה ראשית Main() או main() באף מחלקה בתוכנית (Java / C#).");
        }

        const entryClassName = prog.name;
        const entryMethodName = mainMethod.name;

        // סנאפשוט התחלה
        this.pushSnapshot({
            file: mainMethod.filename,
            line: mainMethod.startLine,
            desc: `נקודת כניסה: הפעלת ${entryClassName}.${entryMethodName}()`,
            action: "start"
        });

        // דחיפה למחסנית קריאות
        this.callStack.push({
            name: `${entryClassName}.${entryMethodName}()`,
            className: entryClassName,
            filename: mainMethod.filename,
            line: mainMethod.startLine
        });

        // הרצת שורות הפעולה הראשית
        const executionContext = {
            scope: {},
            className: entryClassName,
            thisObj: null
        };

        this.executeBlock(mainMethod.bodyLines, executionContext);

        // סנאפשוט סיום
        this.pushSnapshot({
            file: mainMethod.filename,
            line: mainMethod.endLine,
            desc: "סיום הרצת התוכנית בהצלחה.",
            action: "end"
        });

        return this.snapshots;
    }

    executeBlock(bodyLines, ctx) {
        if (!bodyLines || bodyLines.length === 0) return null;

        // חילוץ השורות הפנימיות ללא ה-{ וה-} החיצוניים
        let innerLines = [...bodyLines];
        if (innerLines.length === 1) {
            const raw = innerLines[0].text;
            const firstBrace = raw.indexOf('{');
            const lastBrace = raw.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                const inside = raw.substring(firstBrace + 1, lastBrace).trim();
                innerLines = inside ? [{ text: inside, lineNum: innerLines[0].lineNum }] : [];
            }
        } else {
            if (innerLines.length > 0 && innerLines[0].text.trim().startsWith('{')) {
                innerLines.shift();
            }
            if (innerLines.length > 0 && innerLines[innerLines.length - 1].text.trim().endsWith('}')) {
                innerLines.pop();
            }
        }

        let i = 0;
        while (i < innerLines.length) {
            if (this.snapshots.length >= this.maxSteps) {
                this.pushSnapshot({
                    file: ctx.className ? this.classes[ctx.className]?.filename : 'Program.cs',
                    line: innerLines[i]?.lineNum || 1,
                    desc: "עצירת חירום: התוכנית עברה את רף 1,500 הצעדים (חשש ללולאה אינסופית).",
                    action: "error"
                });
                return null;
            }

            const lineObj = innerLines[i];
            const rawText = lineObj.text;
            const text = rawText.trim();
            const lineNum = lineObj.lineNum;
            const filename = this.classes[ctx.className]?.filename || 'Program.cs';

            i++;
            if (!text || text === '{' || text === '}') continue;

            // 1. קונסול הדפסה: Console.WriteLine(...) / System.out.println(...)
            const cwMatch = text.match(/(?:Console\.(?:WriteLine|Write)|System\.out\.(?:println|print))\s*\((.*)\)\s*;?$/);
            if (cwMatch) {
                const expr = cwMatch[1];
                const evaluatedVal = this.evaluateExpression(expr, ctx);
                const strVal = (evaluatedVal === null || evaluatedVal === undefined) ? "null" : String(evaluatedVal);

                this.consoleLines.push(strVal);
                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `הדפסה למסוף: ${strVal}`,
                    action: "console",
                    highlightAction: "console_print",
                    activeLineText: text
                });
                continue;
            }

            // 2. תנאי if / else
            const ifMatch = text.match(/^if\s*\((.*)\)/);
            if (ifMatch) {
                const condition = ifMatch[1];
                const condVal = this.evaluateCondition(condition, ctx);
                
                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `בדיקת תנאי if (${condition}) ➔ תוצאה: ${condVal ? 'אמת (true)' : 'שקר (false)'}`,
                    action: "condition",
                    activeLineText: text
                });

                // איסוף בלוק if ובלוק else
                const blocks = this.collectIfElseBlocks(innerLines, i - 1);
                i = blocks.nextIndex;

                if (condVal) {
                    this.executeBlock(blocks.ifLines, ctx);
                } else if (blocks.elseLines.length > 0) {
                    this.executeBlock(blocks.elseLines, ctx);
                }
                continue;
            }

            // 3. לולאת for (int i = 0; i < n; i++)
            const forMatch = text.match(/^for\s*\(\s*(?:int\s+)?([A-Za-z0-9_]+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)/);
            if (forMatch) {
                const loopVar = forMatch[1];
                const initVal = Number(this.evaluateExpression(forMatch[2], ctx));
                const condStr = forMatch[3];
                const stepStr = forMatch[4];

                ctx.scope[loopVar] = initVal;
                this.syncStackVar(loopVar, 'int', initVal, false);

                const loopBlock = this.collectLoopBlock(innerLines, i - 1);
                i = loopBlock.nextIndex;

                while (this.evaluateCondition(condStr, ctx)) {
                    this.pushSnapshot({
                        file: filename,
                        line: lineNum,
                        desc: `לולאת for: ${loopVar} = ${ctx.scope[loopVar]} (תנאי ${condStr} מתקיים)`,
                        action: "loop_step",
                        activeLineText: text
                    });

                    this.executeBlock(loopBlock.bodyLines, ctx);

                    // צעד קידום
                    this.executeStepExpr(stepStr, ctx);
                    this.syncStackVar(loopVar, 'int', ctx.scope[loopVar], false);

                    if (this.snapshots.length >= this.maxSteps) break;
                }
                continue;
            }

            // 4. לולאת foreach (Type x in arr)
            const foreachMatch = text.match(/^foreach\s*\(\s*(?:var|[A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+)\s+in\s+([A-Za-z0-9_]+)\s*\)/);
            if (foreachMatch) {
                const itemVar = foreachMatch[1];
                const arrVarName = foreachMatch[2];
                const arrObjRef = ctx.scope[arrVarName] !== undefined ? ctx.scope[arrVarName] : this.stack[arrVarName]?.value;
                const heapObj = this.heap[arrObjRef];

                const loopBlock = this.collectLoopBlock(innerLines, i - 1);
                i = loopBlock.nextIndex;

                if (heapObj && heapObj.isArray) {
                    for (let idx = 0; idx < heapObj.items.length; idx++) {
                        const itemVal = heapObj.items[idx];
                        ctx.scope[itemVar] = itemVal;
                        this.syncStackVar(itemVar, heapObj.elemType, itemVal, true);

                        this.pushSnapshot({
                            file: filename,
                            line: lineNum,
                            desc: `לולאת foreach: איבר [${idx}] = ${itemVal} מתוך מערך ${arrVarName}`,
                            action: "loop_step",
                            activeLineText: text
                        });

                        this.executeBlock(loopBlock.bodyLines, ctx);
                        if (this.snapshots.length >= this.maxSteps) break;
                    }
                }
                continue;
            }

            // 5. לולאת while (cond)
            const whileMatch = text.match(/^while\s*\((.*)\)/);
            if (whileMatch) {
                const condition = whileMatch[1];
                const loopBlock = this.collectLoopBlock(innerLines, i - 1);
                i = loopBlock.nextIndex;

                while (this.evaluateCondition(condition, ctx)) {
                    this.pushSnapshot({
                        file: filename,
                        line: lineNum,
                        desc: `לולאת while: תנאי (${condition}) מתקיים (true)`,
                        action: "loop_step",
                        activeLineText: text
                    });

                    this.executeBlock(loopBlock.bodyLines, ctx);
                    if (this.snapshots.length >= this.maxSteps) break;
                }
                continue;
            }

            // 6. הצהרה ויצירת מערך: Type[] arr = new Type[size];
            const arrDeclMatch = text.match(/^([A-Za-z0-9_]+)\[\]\s+([A-Za-z0-9_]+)\s*=\s*new\s+[A-Za-z0-9_]+\[([^\]]+)\]\s*;?$/);
            if (arrDeclMatch) {
                const elemType = arrDeclMatch[1];
                const arrName = arrDeclMatch[2];
                const size = Number(this.evaluateExpression(arrDeclMatch[3], ctx));

                const heapId = `0x${this.heapCounter++}`;
                this.heap[heapId] = {
                    id: heapId,
                    isArray: true,
                    elemType: elemType,
                    size: size,
                    items: new Array(size).fill(null),
                    className: `${elemType}[]`
                };

                ctx.scope[arrName] = heapId;
                this.syncStackVar(arrName, `${elemType}[]`, heapId, true);

                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `הקצאת מערך הטרוגני ב-Heap: ${arrName} מטיפוס ${elemType}[${size}] בכתובת ${heapId}`,
                    action: "array_alloc",
                    highlightAction: "reference_assign",
                    targetVar: arrName,
                    heapId: heapId,
                    activeLineText: text
                });
                continue;
            }

            // 7. השמה לאיבר מערך: arr[index] = new Derived(...) או ערך
            const arrAssignMatch = text.match(/^([A-Za-z0-9_]+)\[([^\]]+)\]\s*=\s*(.*);?$/);
            if (arrAssignMatch) {
                const arrName = arrAssignMatch[1];
                const index = Number(this.evaluateExpression(arrAssignMatch[2], ctx));
                const rhsExpr = arrAssignMatch[3].replace(/;$/, '').trim();

                const arrHeapId = ctx.scope[arrName] !== undefined ? ctx.scope[arrName] : this.stack[arrName]?.value;
                const arrObj = this.heap[arrHeapId];

                let assignedVal = null;
                if (rhsExpr.startsWith('new ')) {
                    const instMatch = rhsExpr.match(/^new\s+([A-Za-z0-9_]+)\s*\((.*)\)$/);
                    if (instMatch) {
                        assignedVal = this.instantiateObject(instMatch[1], instMatch[2], ctx, filename, lineNum);
                    }
                } else {
                    assignedVal = this.evaluateExpression(rhsExpr, ctx);
                }

                if (arrObj && arrObj.isArray && index >= 0 && index < arrObj.size) {
                    arrObj.items[index] = assignedVal;
                }

                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `השמת אובייקט במערך: ${arrName}[${index}] = ${assignedVal}`,
                    action: "array_assign",
                    highlightAction: "reference_assign",
                    targetVar: `${arrName}[${index}]`,
                    heapId: assignedVal,
                    activeLineText: text
                });
                continue;
            }

            // 8. הצהרת משתנה והקצאת אובייקט חדש: DeclaredType varName = new RuntimeType(args);
            const newObjMatch = text.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)\s*=\s*new\s+([A-Za-z0-9_]+)\s*\((.*)\)\s*;?$/);
            if (newObjMatch) {
                const declaredType = newObjMatch[1];
                const varName = newObjMatch[2];
                const runtimeType = newObjMatch[3];
                const argsStr = newObjMatch[4];

                const heapId = this.instantiateObject(runtimeType, argsStr, ctx, filename, lineNum);
                ctx.scope[varName] = heapId;
                this.syncStackVar(varName, declaredType, heapId, true);

                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `הקצאה ב-Heap והשמה ל-Stack: משתנה '${varName}' מטיפוס מוצהר '${declaredType}' מצביע לאובייקט '${runtimeType}' בכתובת ${heapId}`,
                    action: "new_object",
                    highlightAction: "reference_assign",
                    targetVar: varName,
                    heapId: heapId,
                    declaredType: declaredType,
                    runtimeType: runtimeType,
                    activeLineText: text
                });
                continue;
            }

            // 9. השמה למשתנה רפרנס קיים: varName = new RuntimeType(args)
            const reassignNewMatch = text.match(/^([A-Za-z0-9_]+)\s*=\s*new\s+([A-Za-z0-9_]+)\s*\((.*)\)\s*;?$/);
            if (reassignNewMatch) {
                const varName = reassignNewMatch[1];
                const runtimeType = reassignNewMatch[2];
                const argsStr = reassignNewMatch[3];

                const heapId = this.instantiateObject(runtimeType, argsStr, ctx, filename, lineNum);
                ctx.scope[varName] = heapId;
                const existingType = this.stack[varName]?.type || runtimeType;
                this.syncStackVar(varName, existingType, heapId, true);

                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `עדכון הצבעת משתנה: '${varName}' מצביע כעת לאובייקט '${runtimeType}' חדש בכתובת ${heapId}`,
                    action: "new_object",
                    highlightAction: "reference_assign",
                    targetVar: varName,
                    heapId: heapId,
                    runtimeType: runtimeType,
                    activeLineText: text
                });
                continue;
            }

            // 10. קריאה לפעולה על אובייקט עם המרת טיפוס (Explicit Casting): ((C)obj).Show() או (C)obj.show()
            const castMethodCallMatch = text.match(/^(?:([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)\s*=\s*)?(?:([A-Za-z0-9_]+)\s*=\s*)?\(+\s*([A-Za-z0-9_]+)\s*\)?\s*([A-Za-z0-9_]+)\s*\)?\.([A-Za-z0-9_]+)\s*\((.*)\)\s*;?$/);
            if (castMethodCallMatch) {
                const returnDeclType = castMethodCallMatch[1] || null;
                const assignVar = castMethodCallMatch[2] || castMethodCallMatch[3] || null;
                const targetCastType = castMethodCallMatch[4];
                const targetObjName = castMethodCallMatch[5];
                const methodName = castMethodCallMatch[6];
                const argsStr = castMethodCallMatch[7];

                const returnVal = this.invokeMethod(targetObjName, methodName, argsStr, ctx, filename, lineNum, targetCastType);
                if (assignVar) {
                    ctx.scope[assignVar] = returnVal;
                    const isRef = typeof returnVal === 'string' && !!this.heap[returnVal];
                    const vType = returnDeclType || (isRef ? this.heap[returnVal].className : (typeof returnVal === 'number' ? 'double' : typeof returnVal === 'boolean' ? 'bool' : 'string'));
                    this.syncStackVar(assignVar, vType, returnVal, isRef);

                    this.pushSnapshot({
                        file: filename,
                        line: lineNum,
                        desc: `השמת ערך חוזר מפעולה: ${assignVar} = ${returnVal}`,
                        action: "assign",
                        activeLineText: text
                    });
                }
                continue;
            }

            // 10ב. קריאה לפעולה על אובייקט (עם פולימורפיזם): obj.Method(args) או team[i].Method(args) או var = obj.Method(args)
            const methodCallMatch = text.match(/^(?:([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)\s*=\s*)?(?:([A-Za-z0-9_]+)\s*=\s*)?([A-Za-z0-9_]+(?:\[[^\]]+\])?)\.([A-Za-z0-9_]+)\s*\((.*)\)\s*;?$/);
            if (methodCallMatch && methodCallMatch[4] !== 'Console' && methodCallMatch[4] !== 'Math' && methodCallMatch[4] !== 'System') {
                const returnDeclType = methodCallMatch[1] || null;
                const assignVar = methodCallMatch[2] || methodCallMatch[3] || null;
                const targetObjName = methodCallMatch[4];
                const methodName = methodCallMatch[5];
                const argsStr = methodCallMatch[6];

                const returnVal = this.invokeMethod(targetObjName, methodName, argsStr, ctx, filename, lineNum);
                if (assignVar) {
                    ctx.scope[assignVar] = returnVal;
                    const isRef = typeof returnVal === 'string' && !!this.heap[returnVal];
                    const vType = returnDeclType || (isRef ? this.heap[returnVal].className : (typeof returnVal === 'number' ? 'double' : typeof returnVal === 'boolean' ? 'bool' : 'string'));
                    this.syncStackVar(assignVar, vType, returnVal, isRef);

                    this.pushSnapshot({
                        file: filename,
                        line: lineNum,
                        desc: `השמת ערך חוזר מפעולה: ${assignVar} = ${returnVal}`,
                        action: "assign",
                        activeLineText: text
                    });
                }
                continue;
            }

            // 11. הצהרה או השמה עם המרת טיפוס (Casting Assignment): C c = (C)obj; או c = (C)obj;
            const castAssignMatch = text.match(/^(?:([A-Za-z0-9_]+)\s+)?([A-Za-z0-9_]+)\s*=\s*\(+\s*([A-Za-z0-9_]+)\s*\)?\s*([A-Za-z0-9_]+)\s*\)?\s*;?$/);
            if (castAssignMatch && !text.includes('new ')) {
                const declType = castAssignMatch[1] || null;
                const targetVar = castAssignMatch[2];
                const castType = castAssignMatch[3];
                const sourceVar = castAssignMatch[4];

                const srcHeapId = ctx.scope[sourceVar] !== undefined ? ctx.scope[sourceVar] : this.stack[sourceVar]?.value;
                const heapObj = this.heap[srcHeapId];

                if (heapObj) {
                    if (!heapObj.hierarchy.includes(castType)) {
                        throw new Error(`InvalidCastException: לא ניתן להמיר אובייקט מטיפוס '${heapObj.className}' לטיפוס '${castType}'.`);
                    }

                    const finalType = declType && declType !== 'var' ? declType : castType;
                    ctx.scope[targetVar] = srcHeapId;
                    this.syncStackVar(targetVar, finalType, srcHeapId, true);

                    this.pushSnapshot({
                        file: filename,
                        line: lineNum,
                        desc: `המרת טיפוס (Casting) והשמת הפניה: משתנה '${targetVar}' מטיפוס [${finalType}] מצביע לאובייקט [${heapObj.className}] בכתובת ${srcHeapId} (מתוך '${sourceVar}')`,
                        action: "cast_assign",
                        highlightAction: "reference_assign",
                        targetVar: targetVar,
                        heapId: srcHeapId,
                        declaredType: finalType,
                        runtimeType: heapObj.className,
                        activeLineText: text
                    });
                    continue;
                }
            }

            // 12. הצהרת משתנה פרימיטיבי או העתקת רפרנס: int x = 10; A obj2 = obj;
            const primDeclMatch = text.match(/^([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+)\s*(?:=\s*(.*))?;?$/);
            if (primDeclMatch && !text.includes('(')) {
                const type = primDeclMatch[1];
                const name = primDeclMatch[2];
                const rhs = primDeclMatch[3];

                let val = this.getDefaultValForType(type);
                if (rhs) {
                    val = this.evaluateExpression(rhs.replace(/;$/, '').trim(), ctx);
                }
                const isRef = (typeof val === 'string' && !!this.heap[val]);
                ctx.scope[name] = val;
                this.syncStackVar(name, type, val, isRef);

                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: isRef
                        ? `העתקת הפניה ב-Stack: משתנה '${name}' מטיפוס [${type}] מצביע לאובייקט בכתובת ${val}`
                        : `הצהרת משתנה ב-Stack: ${type} ${name} = ${val}`,
                    action: isRef ? "new_object" : "var_decl",
                    highlightAction: isRef ? "reference_assign" : null,
                    targetVar: name,
                    heapId: isRef ? val : null,
                    activeLineText: text
                });
                continue;
            }

            // 13. השמה למשתנה פרימיטיבי או שדה: x += 5; this.field = val;
            const assignMatch = text.match(/^((?:this\.)?[A-Za-z0-9_]+)\s*(\+=|-=|\*=|\/=|%=|=)\s*(.*);?$/);
            if (assignMatch) {
                const lhs = assignMatch[1];
                const op = assignMatch[2];
                const rhsStr = assignMatch[3].replace(/;$/, '').trim();
                const rhsVal = this.evaluateExpression(rhsStr, ctx);

                if (lhs.startsWith('this.')) {
                    const fieldName = lhs.replace('this.', '');
                    if (ctx.thisObj && ctx.currentLayer) {
                        const layer = ctx.thisObj.layers[ctx.currentLayer];
                        if (layer) {
                            let currVal = layer.fields[fieldName] !== undefined ? layer.fields[fieldName] : 0;
                            layer.fields[fieldName] = this.applyOp(currVal, op, rhsVal);
                            
                            this.pushSnapshot({
                                file: filename,
                                line: lineNum,
                                desc: `השמה לשדה אובייקט: this.${fieldName} = ${layer.fields[fieldName]} בשכבת [${ctx.currentLayer}]`,
                                action: "field_assign",
                                highlightAction: "field_init",
                                activeLayer: ctx.currentLayer,
                                heapId: ctx.thisObj.id,
                                activeLineText: text
                            });
                        }
                    }
                } else {
                    let currVal = ctx.scope[lhs] !== undefined ? ctx.scope[lhs] : (this.stack[lhs]?.value || 0);
                    const newVal = this.applyOp(currVal, op, rhsVal);
                    ctx.scope[lhs] = newVal;
                    const isRef = typeof newVal === 'string' && !!this.heap[newVal];
                    const vType = this.stack[lhs]?.type || (isRef ? this.heap[newVal].className : (typeof newVal === 'number' ? 'int' : 'string'));
                    this.syncStackVar(lhs, vType, newVal, isRef);

                    this.pushSnapshot({
                        file: filename,
                        line: lineNum,
                        desc: `עדכון משתנה ב-Stack: ${lhs} = ${newVal}`,
                        action: "var_assign",
                        targetVar: lhs,
                        activeLineText: text
                    });
                }
                continue;
            }

            // 13. פקודת החזרה: return expr;
            const returnMatch = text.match(/^return(?:\s+(.*))?;?$/);
            if (returnMatch) {
                const returnExpr = returnMatch[1] ? returnMatch[1].replace(/;$/, '').trim() : null;
                const retVal = returnExpr ? this.evaluateExpression(returnExpr, ctx) : null;

                this.pushSnapshot({
                    file: filename,
                    line: lineNum,
                    desc: `החזרת ערך: return ${retVal !== null ? retVal : ''}`,
                    action: "return",
                    activeLineText: text
                });
                return retVal;
            }
        }
        return null;
    }

    applyOp(curr, op, rhs) {
        if (op === '=') return rhs;
        if (op === '+=') return curr + rhs;
        if (op === '-=') return curr - rhs;
        if (op === '*=') return curr * rhs;
        if (op === '/=') return curr / rhs;
        if (op === '%=') return curr % rhs;
        return rhs;
    }

    /**
     * הקצאת אובייקט והפעלת שרשור בנאים (Inward-to-Outward Russian-Doll Construction)
     */
    instantiateObject(className, argsStr, callerCtx, callerFile, callerLine) {
        const targetClass = this.classes[className];
        if (!targetClass) {
            throw new Error(`שגיאה: המחלקה '${className}' אינה מוגדרת.`);
        }

        const args = this.splitArgs(argsStr).map(arg => this.evaluateExpression(arg, callerCtx));
        const heapId = `0x${this.heapCounter++}`;

        // 1. יצירת מעטפת האובייקט בערימה עם כל שכבות ההורשה
        // hierarchy = ['A', 'B', 'C'] - מהבסיס לנגזרת
        const hierarchy = [...targetClass.hierarchy];
        const layers = {};

        // הכנת השכבות במצב התחלתי (pending)
        for (const layerName of hierarchy) {
            const clsDef = this.classes[layerName];
            const fields = {};
            if (clsDef) {
                for (const f of clsDef.fields) {
                    fields[f.name] = f.defaultVal ? this.evaluateExpression(f.defaultVal, callerCtx) : this.getDefaultValForType(f.type);
                }
            }
            layers[layerName] = {
                className: layerName,
                status: 'pending', // pending -> constructing -> constructed
                fields: fields
            };
        }

        const heapObj = {
            id: heapId,
            className: className,
            hierarchy: hierarchy,
            layers: layers,
            isArray: false
        };
        this.heap[heapId] = heapObj;

        // סנאפשוט שלב 1: הקצאת שלד האובייקט
        this.pushSnapshot({
            file: callerFile,
            line: callerLine,
            desc: `הקצאת מעטפת ב-Heap לאובייקט חדש מטיפוס [${className}]. שרשרת ההורשה: ${hierarchy.join(' ➔ ')}`,
            action: "ctor_shell",
            highlightAction: "constructor_chain",
            heapId: heapId,
            runtimeType: className,
            activeLayer: className
        });

        // 2. הפעלת שרשור בנאים: מ-C ל-B ל-A (איסוף שרשרת קריאות)
        // לאחר מכן ביצוע גופי הבנאים מבפנים החוצה (A ואז B ואז C)
        this.executeConstructorChain(heapObj, className, args, callerCtx);

        return heapId;
    }

    executeConstructorChain(heapObj, className, initialArgs, callerCtx) {
        // בניית מחסנית שרשור בנאים
        const chainSteps = [];
        let currClass = className;
        let currArgs = initialArgs;

        while (currClass && this.classes[currClass]) {
            const clsDef = this.classes[currClass];
            const ctorDef = clsDef.constructors[0] || {
                params: [],
                chainType: clsDef.baseClass ? 'base' : null,
                chainArgs: [],
                bodyLines: [],
                startLine: clsDef.startLine,
                endLine: clsDef.startLine,
                filename: clsDef.filename
            };

            // יצירת סקופ פרמטרים לבנאי זה
            const ctorScope = {};
            ctorDef.params.forEach((param, idx) => {
                ctorScope[param.name] = currArgs[idx] !== undefined ? currArgs[idx] : this.getDefaultValForType(param.type);
            });

            chainSteps.push({
                className: currClass,
                ctorDef: ctorDef,
                scope: ctorScope,
                filename: ctorDef.filename,
                startLine: ctorDef.startLine,
                endLine: ctorDef.endLine
            });

            // אם יש שרשור ל-base(...) מחשבים את הארגומנטים לשכבה הבאה
            if (ctorDef.chainType === 'base' && clsDef.baseClass) {
                const nextCtx = { scope: ctorScope, className: currClass, thisObj: heapObj };
                currArgs = ctorDef.chainArgs.map(arg => this.evaluateExpression(arg, nextCtx));
                currClass = clsDef.baseClass;
            } else {
                currClass = null;
            }
        }

        // סנאפשוט שלב שרשור הבנאים כלפי מעלה (טיפוס ל-base)
        for (let i = 0; i < chainSteps.length; i++) {
            const step = chainSteps[i];
            const nextStep = chainSteps[i + 1];

            this.pushSnapshot({
                file: step.filename,
                line: step.startLine,
                desc: nextStep 
                    ? `בנאי [${step.className}]: שרשור והעברת פרמטרים למחלקת האב base(${step.ctorDef.chainArgs.join(', ')}) ➔ אל [${nextStep.className}]`
                    : `בנאי ליבת הבסיס [${step.className}]: הגיע לראש עץ ההורשה. מתחיל אתחול שדות הליבה!`,
                action: "ctor_chain_up",
                highlightAction: "constructor_chain",
                heapId: heapObj.id,
                activeLayer: step.className
            });
        }

        // 3. כעת ביצוע גופי הבנאים מהבסיס החוצה (Inward to Outward: רוורס של chainSteps)
        const reverseSteps = [...chainSteps].reverse();

        for (const step of reverseSteps) {
            const layer = heapObj.layers[step.className];
            if (layer) layer.status = 'constructing';

            this.callStack.push({
                name: `${step.className} (Constructor)`,
                className: step.className,
                filename: step.filename,
                line: step.startLine
            });

            this.pushSnapshot({
                file: step.filename,
                line: step.startLine,
                desc: `בניית שכבת [${step.className}]: כניסה לגוף הבנאי ואתחול שדות השכבה בבובה הרוסית`,
                action: "ctor_body_enter",
                highlightAction: "constructor_chain",
                heapId: heapObj.id,
                activeLayer: step.className
            });

            const ctorCtx = {
                scope: step.scope,
                className: step.className,
                currentLayer: step.className,
                thisObj: heapObj
            };

            this.executeBlock(step.ctorDef.bodyLines, ctorCtx);

            if (layer) layer.status = 'constructed';

            this.pushSnapshot({
                file: step.filename,
                line: step.endLine,
                desc: `השלמת בניית שכבת [${step.className}] בהצלחה! השדות מקובעים במבנה האובייקט.`,
                action: "ctor_layer_done",
                highlightAction: "constructor_chain",
                heapId: heapObj.id,
                activeLayer: step.className
            });

            this.callStack.pop();
        }
    }

    /**
     * זימון פעולה עם פולימורפיזם והכרעה דינמית (Dynamic Dispatch) ותמיכה ב-Casting
     */
    invokeMethod(targetObjName, methodName, argsStr, callerCtx, callerFile, callerLine, explicitCastType = null) {
        // מציאת הפניית האובייקט ב-Stack או מתוך מערך
        let heapId = null;
        let declaredType = null;

        if (targetObjName.includes('[')) {
            heapId = this.evaluateExpression(targetObjName, callerCtx);
            const arrName = targetObjName.split('[')[0];
            const arrType = this.stack[arrName]?.type || '';
            const baseElemType = arrType.endsWith('[]') ? arrType.slice(0, -2) : (this.heap[heapId]?.className || 'Object');
            declaredType = explicitCastType || baseElemType;
        } else {
            heapId = callerCtx.scope[targetObjName] !== undefined ? callerCtx.scope[targetObjName] : this.stack[targetObjName]?.value;
            declaredType = explicitCastType || this.stack[targetObjName]?.type || this.heap[heapId]?.className;
        }

        const heapObj = this.heap[heapId];

        if (!heapObj) {
            throw new Error(`NullReferenceException: המשתנה '${targetObjName}' אינו מצביע על אובייקט ב-Heap.`);
        }

        // בדיקת תקינות המרה מפורשת (Casting / Downcasting)
        if (explicitCastType) {
            if (!heapObj.hierarchy.includes(explicitCastType)) {
                throw new Error(`InvalidCastException: לא ניתן להמיר אובייקט מטיפוס '${heapObj.className}' לטיפוס '${explicitCastType}'.`);
            }
        }

        const runtimeType = heapObj.className;
        const args = this.splitArgs(argsStr).map(arg => this.evaluateExpression(arg, callerCtx));

        // 1. הנפשת הכרעה דינמית: חיפוש פעולה משכבת הריצה RuntimeType ועלייה בשכבות
        // תמיכה בחיפוש רגיל או case-insensitive (למשל Show מול show)
        const searchHierarchy = [...heapObj.hierarchy].reverse(); // מ-C ל-B ל-A
        let resolvedMethod = null;
        let resolvedClass = null;

        for (const layerName of searchHierarchy) {
            const cls = this.classes[layerName];
            if (cls) {
                const m = cls.methods[methodName] || Object.values(cls.methods).find(method => method.name.toLowerCase() === methodName.toLowerCase());
                if (m) {
                    resolvedMethod = m;
                    resolvedClass = layerName;
                    break;
                }
            }
        }

        if (!resolvedMethod) {
            throw new Error(`שגיאה: הפעולה '${methodName}' אינה קיימת בהיררכיית המחלקה '${runtimeType}'.`);
        }

        const isPolymorphic = declaredType !== runtimeType;
        const isOverride = resolvedMethod.isOverride;

        // ניסוח תיאור פדגוגי בעברית
        let stepDesc = '';
        if (explicitCastType) {
            const origDeclared = this.stack[targetObjName]?.type || declaredType;
            stepDesc = `המרה מפורשת (Downcasting) וזימון פעולה: ((${explicitCastType})${targetObjName}).${resolvedMethod.name}()! המרת טיפוס ההפניה מ-[${origDeclared}] ל-[${explicitCastType}]. החיפוש החל בשכבה [${runtimeType}] ונמצא מימוש ${isOverride ? 'דרוס (override)' : ''} בשכבת [${resolvedClass}]!`;
        } else if (isPolymorphic) {
            stepDesc = `הכרעה דינמית (Polymorphism): זימון ${targetObjName}.${resolvedMethod.name}()! טיפוס מוצהר ב-Stack: [${declaredType}], אובייקט בפועל ב-Heap: [${runtimeType}]. החיפוש החל בשכבה [${runtimeType}] ונמצא מימוש ${isOverride ? 'דרוס (override)' : ''} בשכבת [${resolvedClass}]!`;
        } else {
            stepDesc = `זימון פעולה: ${targetObjName}.${resolvedMethod.name}() בשכבת [${resolvedClass}]`;
        }

        // סנאפשוט שלב Dynamic Dispatch עם הסבר פדגוגי מפורט
        this.pushSnapshot({
            file: callerFile,
            line: callerLine,
            desc: stepDesc,
            action: "dynamic_dispatch",
            highlightAction: "dynamic_dispatch",
            targetVar: targetObjName,
            heapId: heapId,
            declaredType: declaredType,
            runtimeType: runtimeType,
            methodName: resolvedMethod.name,
            resolvedClass: resolvedClass,
            isOverride: isOverride,
            searchPath: searchHierarchy
        });

        // 2. כניסה לביצוע הפעולה
        this.callStack.push({
            name: `${resolvedClass}.${resolvedMethod.name}()`,
            className: resolvedClass,
            filename: resolvedMethod.filename,
            line: resolvedMethod.startLine
        });

        const methodScope = {};
        resolvedMethod.params.forEach((param, idx) => {
            methodScope[param.name] = args[idx] !== undefined ? args[idx] : this.getDefaultValForType(param.type);
        });

        const methodCtx = {
            scope: methodScope,
            className: resolvedClass,
            currentLayer: resolvedClass,
            thisObj: heapObj
        };

        const result = this.executeBlock(resolvedMethod.bodyLines, methodCtx);

        this.callStack.pop();
        return result;
    }

    /**
     * הערכת ביטוי (Expression Evaluation)
     */
    evaluateExpression(expr, ctx) {
        if (expr === null || expr === undefined) return null;
        expr = String(expr).trim();

        // מחרוזת בודדת פשוטה ללא שרשור: "שלום"
        if (/^"[^"]*"$/.test(expr)) {
            return expr.slice(1, -1);
        }

        // מחרוזת אינטרפולציה: $"Total: {x}"
        if (expr.startsWith('$"') && expr.endsWith('"')) {
            const inner = expr.slice(2, -1);
            return inner.replace(/\{([^}]+)\}/g, (match, code) => {
                const cleanCode = code.replace(/:[A-Za-z0-9]+$/, '').trim(); // ניקוי :C או :F2
                const val = this.evaluateExpression(cleanCode, ctx);
                return val !== null && val !== undefined ? val : '';
            });
        }

        // מספרים ישירים
        if (!isNaN(expr) && expr !== '') {
            return Number(expr);
        }

        // בוליאנים ו-null
        if (expr === 'true') return true;
        if (expr === 'false') return false;
        if (expr === 'null') return null;

        // החלפת גישה ל-Length של מערך: arr.Length או arr.length בכל מקום בביטוי
        expr = expr.replace(/\b([A-Za-z0-9_]+)\.(?:Length|length)\b/g, (m, arrVar) => {
            const arrHeapId = ctx.scope[arrVar] !== undefined ? ctx.scope[arrVar] : this.stack[arrVar]?.value;
            const heapObj = this.heap[arrHeapId];
            return heapObj && heapObj.isArray ? heapObj.size : 0;
        });

        // החלפת קריאות base.Method(args) או super.Method(args) בתוך ביטוי
        expr = expr.replace(/\b(?:base|super)\.([A-Za-z0-9_]+)\s*\(([^)]*)\)/gi, (m, methodName, argsStr) => {
            if (ctx.thisObj && ctx.currentLayer) {
                const currIdx = ctx.thisObj.hierarchy.indexOf(ctx.currentLayer);
                if (currIdx > 0) {
                    const baseLayerName = ctx.thisObj.hierarchy[currIdx - 1];
                    const baseCls = this.classes[baseLayerName];
                    if (baseCls) {
                        const methodDef = baseCls.methods[methodName] || Object.values(baseCls.methods).find(bm => bm.name.toLowerCase() === methodName.toLowerCase());
                        if (methodDef) {
                            const nextCtx = {
                                scope: {},
                                className: baseLayerName,
                                currentLayer: baseLayerName,
                                thisObj: ctx.thisObj
                            };
                            const args = this.splitArgs(argsStr).map(a => this.evaluateExpression(a, ctx));
                            methodDef.params.forEach((p, idx) => nextCtx.scope[p.name] = args[idx]);
                            const ret = this.executeBlock(methodDef.bodyLines, nextCtx);
                            return typeof ret === 'string' ? JSON.stringify(ret) : ret;
                        }
                    }
                }
            }
            return '0';
        });

        // החלפת קריאות לפעולות אובייקט עם המרת טיפוס (Casting): ((C)obj).Method(args) או (C)obj.Method(args)
        expr = expr.replace(/\(?\(([A-Za-z0-9_]+)\)\s*([A-Za-z0-9_]+)\)?\.([A-Za-z0-9_]+)\s*\(([^)]*)\)/g, (m, castType, targetName, methodName, argsStr) => {
            const heapId = ctx.scope[targetName] !== undefined ? ctx.scope[targetName] : this.stack[targetName]?.value;
            if (heapId && this.heap[heapId]) {
                const ret = this.invokeMethod(targetName, methodName, argsStr, ctx, this.classes[ctx.className]?.filename || 'Program.cs', 1, castType);
                return typeof ret === 'string' ? JSON.stringify(ret) : ret;
            }
            return m;
        });

        // החלפת קריאות לפעולות אובייקט בתוך ביטוי: obj.Method(args)
        expr = expr.replace(/\b([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*\(([^)]*)\)/g, (m, targetName, methodName, argsStr) => {
            if (targetName === 'Console' || targetName === 'Math') return m;
            const heapId = ctx.scope[targetName] !== undefined ? ctx.scope[targetName] : this.stack[targetName]?.value;
            if (heapId && this.heap[heapId]) {
                const ret = this.invokeMethod(targetName, methodName, argsStr, ctx, this.classes[ctx.className]?.filename || 'Program.cs', 1);
                return typeof ret === 'string' ? JSON.stringify(ret) : ret;
            }
            return m;
        });

        // החלפת המרת טיפוס מפורשת של רפרנס: (TargetType)varName או ((TargetType)varName)
        expr = expr.replace(/\(?\(([A-Za-z0-9_]+)\)\s*([A-Za-z0-9_]+)\)?/g, (m, castType, varName) => {
            const heapId = ctx.scope[varName] !== undefined ? ctx.scope[varName] : this.stack[varName]?.value;
            if (heapId && this.heap[heapId]) {
                return JSON.stringify(heapId);
            }
            return m;
        });

        // גישה לאיבר מערך: arr[i]
        const arrAccess = expr.match(/^([A-Za-z0-9_]+)\[([^\]]+)\]$/);
        if (arrAccess) {
            const arrName = arrAccess[1];
            const idx = Number(this.evaluateExpression(arrAccess[2], ctx));
            const arrHeapId = ctx.scope[arrName] !== undefined ? ctx.scope[arrName] : this.stack[arrName]?.value;
            const heapObj = this.heap[arrHeapId];
            if (heapObj && heapObj.isArray && idx >= 0 && idx < heapObj.size) {
                return heapObj.items[idx];
            }
            return null;
        }

        // החלפת this.fieldName בערכו בכל מקום בביטוי
        expr = expr.replace(/\bthis\.([A-Za-z0-9_]+)\b/g, (m, fieldName) => {
            if (ctx.thisObj && ctx.currentLayer) {
                const hIdx = ctx.thisObj.hierarchy.indexOf(ctx.currentLayer);
                for (let k = hIdx; k >= 0; k--) {
                    const lName = ctx.thisObj.hierarchy[k];
                    const layer = ctx.thisObj.layers[lName];
                    if (layer && layer.fields[fieldName] !== undefined) {
                        const val = layer.fields[fieldName];
                        return typeof val === 'string' ? JSON.stringify(val) : val;
                    }
                }
            }
            return '0';
        });

        // החלפת שדות של האובייקט הנוכחי המופיעים ללא this (אם אינם דרוסים בסקופ)
        if (ctx.thisObj && ctx.currentLayer) {
            const hIdx = ctx.thisObj.hierarchy.indexOf(ctx.currentLayer);
            for (let k = hIdx; k >= 0; k--) {
                const lName = ctx.thisObj.hierarchy[k];
                const layer = ctx.thisObj.layers[lName];
                if (layer) {
                    for (const [fName, fVal] of Object.entries(layer.fields)) {
                        if (ctx.scope[fName] === undefined) {
                            const fRegex = new RegExp(`\\b${fName}\\b`, 'g');
                            expr = this.replaceOutsideQuotes(expr, (codeSegment) => {
                                return codeSegment.replace(fRegex, typeof fVal === 'string' ? JSON.stringify(fVal) : fVal);
                            });
                        }
                    }
                }
            }
        }

        // משתנה מקומי או פרמטר בסקופ
        if (ctx.scope[expr] !== undefined) {
            return ctx.scope[expr];
        }

        // משתנה במחסנית (Stack)
        if (this.stack[expr] !== undefined) {
            return this.stack[expr].value;
        }

        // פעולות חשבון וחיבור מחרוזות (A + B, A - B, A * B, A / B)
        try {
            // החלפת שמות משתנים בערכיהם אך ורק מחוץ למחרוזות מפורשות
            const resolvedExpr = this.replaceOutsideQuotes(expr, (codeSegment) => {
                return codeSegment.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (match) => {
                    if (match === 'true' || match === 'false' || match === 'null') return match;
                    if (ctx.scope[match] !== undefined) return JSON.stringify(ctx.scope[match]);
                    if (this.stack[match] !== undefined) return JSON.stringify(this.stack[match].value);
                    if (ctx.thisObj && ctx.currentLayer) {
                        const hIdx = ctx.thisObj.hierarchy.indexOf(ctx.currentLayer);
                        for (let k = hIdx; k >= 0; k--) {
                            const l = ctx.thisObj.layers[ctx.thisObj.hierarchy[k]];
                            if (l && l.fields[match] !== undefined) return JSON.stringify(l.fields[match]);
                        }
                    }
                    return match;
                });
            });
            // eslint-disable-next-line no-eval
            return Function(`'use strict'; return (${resolvedExpr})`)();
        } catch (e) {
            return expr;
        }
    }

    replaceOutsideQuotes(str, codeReplacer) {
        return str.replace(/"(?:[^"\\]|\\.)*"|'[^']*'|([^"']+)/g, (match, codePart) => {
            if (match.startsWith('"') || match.startsWith("'")) {
                return match;
            }
            return codeReplacer(match);
        });
    }

    evaluateCondition(cond, ctx) {
        if (!cond || !cond.trim()) return true;
        cond = cond.trim();

        // בדיקת is / as / instanceof: (obj is Manager) או (obj instanceof Manager)
        const isMatch = cond.match(/^([A-Za-z0-9_]+)\s+(?:is|instanceof)\s+([A-Za-z0-9_]+)$/);
        if (isMatch) {
            const varName = isMatch[1];
            const checkType = isMatch[2];
            const heapId = ctx.scope[varName] !== undefined ? ctx.scope[varName] : this.stack[varName]?.value;
            const heapObj = this.heap[heapId];
            if (!heapObj) return false;
            return heapObj.hierarchy.includes(checkType);
        }

        // החלפת arr.Length או arr.length בתוך תנאי
        cond = cond.replace(/\b([A-Za-z0-9_]+)\.(?:Length|length)\b/g, (m, arrVar) => {
            const arrHeapId = ctx.scope[arrVar] !== undefined ? ctx.scope[arrVar] : this.stack[arrVar]?.value;
            const heapObj = this.heap[arrHeapId];
            return heapObj && heapObj.isArray ? heapObj.size : 0;
        });

        try {
            const resolved = cond.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (match) => {
                if (match === 'true' || match === 'false' || match === 'null') return match;
                if (ctx.scope[match] !== undefined) return JSON.stringify(ctx.scope[match]);
                if (this.stack[match] !== undefined) return JSON.stringify(this.stack[match].value);
                return match;
            });
            return !!Function(`'use strict'; return (${resolved})`)();
        } catch (e) {
            return false;
        }
    }

    executeStepExpr(stepStr, ctx) {
        if (!stepStr) return;
        stepStr = stepStr.trim();
        const incMatch = stepStr.match(/^([A-Za-z0-9_]+)\+\+$/);
        if (incMatch) {
            const v = incMatch[1];
            ctx.scope[v] = (ctx.scope[v] || 0) + 1;
            return;
        }
        const decMatch = stepStr.match(/^([A-Za-z0-9_]+)--$/);
        if (decMatch) {
            const v = decMatch[1];
            ctx.scope[v] = (ctx.scope[v] || 0) - 1;
            return;
        }
        const addAssign = stepStr.match(/^([A-Za-z0-9_]+)\s*\+=\s*(.*)$/);
        if (addAssign) {
            const v = addAssign[1];
            const val = Number(this.evaluateExpression(addAssign[2], ctx));
            ctx.scope[v] = (ctx.scope[v] || 0) + val;
        }
    }

    collectIfElseBlocks(lines, startIdx) {
        let i = startIdx + 1;
        const ifLines = [];
        const elseLines = [];

        // איסוף בלוק if
        if (lines[i]?.text.trim() === '{') {
            let depth = 1;
            i++;
            while (i < lines.length && depth > 0) {
                const t = lines[i].text;
                if (t.includes('{')) depth++;
                if (t.includes('}')) depth--;
                if (depth > 0) ifLines.push(lines[i]);
                i++;
            }
        } else if (i < lines.length) {
            ifLines.push(lines[i]);
            i++;
        }

        // בדיקת else
        if (i < lines.length && lines[i]?.text.trim().startsWith('else')) {
            const elseText = lines[i].text.trim();
            i++;
            if (elseText === 'else' && i < lines.length && lines[i]?.text.trim() === '{') {
                let depth = 1;
                i++;
                while (i < lines.length && depth > 0) {
                    const t = lines[i].text;
                    if (t.includes('{')) depth++;
                    if (t.includes('}')) depth--;
                    if (depth > 0) elseLines.push(lines[i]);
                    i++;
                }
            } else if (i < lines.length) {
                elseLines.push(lines[i]);
                i++;
            }
        }

        return { ifLines, elseLines, nextIndex: i };
    }

    collectLoopBlock(lines, startIdx) {
        let i = startIdx + 1;
        const bodyLines = [];

        if (lines[i]?.text.trim() === '{') {
            let depth = 1;
            i++;
            while (i < lines.length && depth > 0) {
                const t = lines[i].text;
                if (t.includes('{')) depth++;
                if (t.includes('}')) depth--;
                if (depth > 0) bodyLines.push(lines[i]);
                i++;
            }
        } else if (i < lines.length) {
            bodyLines.push(lines[i]);
            i++;
        }

        return { bodyLines, nextIndex: i };
    }

    syncStackVar(name, type, val, isRef) {
        this.stack[name] = {
            name: name,
            type: type,
            value: val,
            isRef: isRef,
            heapId: isRef ? val : null
        };
    }

    getDefaultValForType(type) {
        if (!type) return null;
        if (type === 'int' || type === 'double' || type === 'float') return 0;
        if (type === 'bool' || type === 'boolean') return false;
        if (type === 'string' || type === 'String') return "";
        if (type === 'char') return ' ';
        return null;
    }

    /**
     * הפקת סנאפשוט מעמיק (Deep Snapshot) לשכפול מלא של המצב בכל רגע
     */
    pushSnapshot(meta) {
        // העתקה עמוקה של ה-Heap והשכבות הקונצנטריות
        const deepHeap = JSON.parse(JSON.stringify(this.heap));
        const deepStack = JSON.parse(JSON.stringify(this.stack));
        const deepCallStack = JSON.parse(JSON.stringify(this.callStack));
        const deepConsole = [...this.consoleLines];

        this.snapshots.push({
            stepIndex: this.snapshots.length + 1,
            file: meta.file || 'Program.cs',
            line: meta.line || 1,
            desc: meta.desc || '',
            action: meta.action || 'step',
            highlightAction: meta.highlightAction || null,
            activeLineText: meta.activeLineText || '',
            targetVar: meta.targetVar || null,
            heapId: meta.heapId || null,
            declaredType: meta.declaredType || null,
            runtimeType: meta.runtimeType || null,
            activeLayer: meta.activeLayer || null,
            methodName: meta.methodName || null,
            resolvedClass: meta.resolvedClass || null,
            isOverride: !!meta.isOverride,
            searchPath: meta.searchPath || [],
            stack: deepStack,
            heap: deepHeap,
            callStack: deepCallStack,
            console: deepConsole
        });
    }
}

if (typeof window !== 'undefined') {
    window.CSharpOOPInterpreter = CSharpOOPInterpreter;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSharpOOPInterpreter;
}
