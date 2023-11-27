export async function getJson(url) {
    let result = null;
    await fetch(url)
    .then(async function resolve(res) {
        const json = await res.json();
        result = json;
    }).catch(err => {
        throw err;
    });
    return result;
}

const languageNames = {
    "english": "Englisch",
    "german": "Deutsch",
    "french": "Französisch"
}

export function getLanguageName(language) {
    return languageNames[language];
}

export function extractOccurances(vocabulary) {
    let occurances = new Set();
    for (let i = 0; i < vocabulary.length; i++) {
        let vocabOccurances = vocabulary[i].occurances;
        for (let j = 0; j < vocabOccurances.length; j++) {
            let occurance = vocabOccurances[j];
            let split = occurance.split(" ");
            let splitWord = "";
            for (let k = 0; k < split.length; k++) {
                splitWord += split[k] + " ";
                occurances.add(splitWord.trim());
            }
        }
    }
    return occurances;
}
