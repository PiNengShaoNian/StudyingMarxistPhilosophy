const fs = require('fs')

const multiChoicesRE = /(A:\s*\S+(?:\s+正确答案)?)\s+(B:\s*\S+(?:\s+正确答案)?)\s+(C:\s*\S+(?:\s+正确答案)?)\s+(D:\s*\S+(?:\s+正确答案)?)/
const tofChoicesRE = /(正确\s+(?:正确答案)?)\s+(错误\s+(?:正确答案)?)/
const titleRE = /分值: 1\s+得分：0\s+(.+)/

let temp = fs.readFileSync('./testPaperStr10.txt').toString()

// console.log(temp)

const getQuestionStrByNum = (temp, num) => {
  const endTag = `${num + 1}、`
  const end = temp.indexOf(endTag)
  if (end > -1) {
    const question = temp.slice(0, end)
    return [question, temp.slice(end)]
  } else {
    return [temp, '']
  }
}

const getQuestionType = (question) => {
  const types = ['多选题', '判断题', '单选题']
  return (
    types
      .map((type) => (question.indexOf(type) > -1 ? type : ''))
      .filter(Boolean) + ''
  )
}

const processMultiQuestion = (question, num) => {
  const [_, A, B, C, D] = question.match(multiChoicesRE)
  const [__, title] = question.match(titleRE)
  return {
    type: 'multi',
    num,
    choices: [A, B, C, D]
      .map((v) => v.replace(/\s*/g, ''))
      .map((v) =>
        v.indexOf('正确答案') > -1
          ? { isTrue: true, value: v.replace('正确答案', '') }
          : { isTrue: false, value: v }
      ),
    title,
  }
}

const processSingleQuestion = (question, num) => {
  return { ...processMultiQuestion(question, num), type: 'single' }
}

const processTOFQuestion = (question, num) => {
  const [_, trueOption, falseOption] = question.match(tofChoicesRE)
  const [__, title] = question.match(titleRE)

  return {
    type: 'tof',
    choices: [trueOption, falseOption]
      .map((v) => v.replace(/\s+/g, ''))
      .map((v) =>
        v.indexOf('正确答案') > -1
          ? { isTrue: true, value: v.replace('正确答案', '') }
          : { isTrue: false, value: v }
      ),
    num,
    title,
  }
}

const normalizeQuestion = (question, type, num) => {
  if (!question) return
  let result
  if (type === '多选题') {
    result = processMultiQuestion(question, num)
  } else if (type === '单选题') {
    result = processSingleQuestion(question, num)
  } else {
    result = processTOFQuestion(question, num)
  }

  return result
}

let i = 1
const questions = []
while (temp.length) {
  const [question, t] = getQuestionStrByNum(temp, i)
  const type = getQuestionType(question)
  const normalizedQuestion = normalizeQuestion(question, type, i)
  questions.push(normalizedQuestion)
  temp = t
  i++
}

fs.writeFileSync('./testPaper10JSON.json', JSON.stringify(questions, null, 2))
