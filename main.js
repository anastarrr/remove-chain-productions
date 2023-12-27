window.onload = () => {
    const apply = document.getElementById("apply")
    const ex1 = document.getElementById("ex1")
    const ex2 = document.getElementById("ex2")
    const ex3 = document.getElementById("ex3")
    apply.onclick = applyAlgorithm
    ex1.onclick = example1
    ex2.onclick = example2
    ex3.onclick = example3
}
function applyAlgorithm() {
    clearContainers(['chain', 'chain-res'])
    const rawProds = readProds()
    const prods = parseProds(rawProds)
    const prodsWithoutChain = deleteChainProds(prods)
    printProds(prodsWithoutChain, 'chain-res', 1)
}

function clearContainers(ids) {
    ids.forEach((id) => {
        const parent = document.getElementById(id)
        parent.innerHTML = ''
    })
}

function printProds(prods, id, s) {
    const parent = document.getElementById(id)
    const span = document.createElement('span')
    span.innerHTML = `P${s === 1 ? '\'' : '\'\''}:`
    parent.appendChild(span)
    Object.entries(prods).forEach(([nonterm, transitions]) => {
        let trans = ''
        transitions.forEach((i, ind) => {
            trans += i
            if (ind + 1 < transitions.length) trans += ' | '
        })
        let str = `${nonterm} → ${trans}`
        const div = document.createElement('div')
        div.innerHTML = str
        parent.appendChild(div)
    })
}

function printSet(y, nonterm, ind, id, mb) {
    const a = Array.from(y)
    let str = `N<sup>${nonterm}</sup>`
    if (ind) {
        str = str + `<sub>${ind}</sub> = `
    } else {
        str = str + " = ";
    }
    if (a.length === 0) str += 'ø'
    else {
        str += '{'
        a.forEach((i, index) => {
            str += (index + 1 < a.length) ? `${i}, ` : `${i}}`
        })
    }
    const div = document.createElement('div')
    div.innerHTML = str
    div.style.marginBottom = `${mb}px`;
    const parent = document.getElementById(id)
    parent.appendChild(div)
}

function deleteChainProds(prods) {
    const newProds = {};
    Object.entries(prods).forEach(([nonterm, transitions]) => {
        const N = new Set();
        N.add(nonterm);
        let needIter = true;
        let iters = 0;
        printSet(N, nonterm, ++iters, 'chain')
    
        while (needIter) {
            const l = N.size;
            const NArray = Array.from(N);
            NArray.forEach((item) => {
                prods?.[item]?.forEach((trans) => {
                    if (isChain(trans)) {
                        N.add(trans);
                    }
                });
            })
            needIter = N.size > l
            printSet(N, nonterm, ++iters, 'chain')
        }

        const NArray = Array.from(N);
        
        newProds[nonterm] = new Set();
        NArray.forEach((symb) => {
            const trans = prods[symb];
            if (trans) {
                trans.forEach((t) => { 
                    if (!isChain(t)) {
                        newProds[nonterm].add(t)
                    }
                })
            }
        })

        newProds[nonterm] = Array.from(newProds[nonterm]);

        N.delete(nonterm);
        printSet(N, nonterm, null, 'chain', 15)
    })

    return newProds;
}

function deleteUnreachableSymbols(prods) {
    const y = new Set()
    y.add('S')
    let needIter = true
    let iters = 0
    printSet(y, iters, 'unreachable')
    while (needIter) {
        const oldSize = y.size
        const yArray = Array.from(y)
        yArray.forEach((n) => {
            if (isNonterminal(n)) {
                const transitions = prods[n]
                if (transitions) {
                    transitions.forEach((t) => {
                        const symbols = t.match(/\\?.|./g)
                        symbols.forEach((s) => {
                            y.add(s)
                        })
                    })
                }
            }
        })
        needIter = y.size > oldSize
        printSet(y, ++iters, 'unreachable')
    }
    const prodsWithoutUnreachable = Object.fromEntries(Object.entries(prods).filter(([nonterm]) => y.has(nonterm)))
    return prodsWithoutUnreachable
}

function deleteBarrenSymbols(prods) {
    const y = new Set()
    let needIter = true
    let iters = 0
    printSet(y, iters, 'barren')
    while (needIter) {
        const oldSize = y.size
        Object.entries(prods).forEach(([nonterm, transitions]) => {
            const isNotBarren = transitions.some((a) => {
                return a.split('').every((c) => isTerminal(c) || y.has(c))
            })
            if (isNotBarren) {
                y.add(nonterm)
            }
        })
        needIter = y.size > oldSize
        iters++
        printSet(y, iters, 'barren')
    }
    const prodsWithoutBarren = Object.fromEntries(Object.entries(prods).filter(([nonterm]) => y.has(nonterm)))
    clearTransitions(prodsWithoutBarren, y)
    return prodsWithoutBarren
}

function clearTransitions(prods, validNonterms) {
    for (let key of Object.keys(prods)) {
        prods[key] = prods[key].filter((a) => {
            return !a.split('').some((c) => isNonterminal(c) && !validNonterms.has(c))
        })
    }
}

function isChain(p) {
    return isNonterminal(p) && p.length === 1;
}

function isLetter(c) {
    return c.toLowerCase() !== c.toUpperCase();
}

function isTerminal(c) {
    return c.toLowerCase() === c
}

function isNonterminal(c) {
    return c.toUpperCase() === c && isLetter(c)
}

function parseProds(rawProds) {
    const normalizedArray = normalizeProds(rawProds)
    const prods = {}
    normalizedArray.forEach((a) => {
        let [nonterm, transitions] = a.split('->')
        transitions = transitions.split('|')
        if (prods[nonterm]) {
            prods[nonterm].push(...transitions);
        } else {
            prods[nonterm] = transitions;
        }
    })
    return prods
}

function normalizeProds(rawProds) {
    let arrayString = rawProds.split('\n')
    arrayString = arrayString.map((a) => a.replaceAll(' ', ''))
    arrayString = arrayString.filter((a) => Boolean(a))
    return arrayString
}

function readProds() {
    const form = document.getElementById('input')
    return form.value
}

function example1() {
    const form = document.getElementById('input')
    form.value = `S -> A
A -> B|a
B -> C|b
C -> DD|c`
}

function example2() {
    const form = document.getElementById('input')
    form.value = `S -> CCcC|AA|A
A -> EC|cc|a|B
B -> BC|BaB|a|C
C -> bb|a|c|E
E -> a`
}

function example3() {
    const form = document.getElementById('input')
    form.value = `S -> O|P|a
P -> S|a|O
O -> U(P)|g 
U -> f|O`
}