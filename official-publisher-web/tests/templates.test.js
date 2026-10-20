const test = require('node:test')
const assert = require('node:assert/strict')
const { buildArticle } = require('../src/article')
const { TEMPLATES } = require('../src/templates')

const recipe = {
  recipeId: 8, title: '<示例菜>', categoryName: '家常菜', summary: '简单又好吃',
  difficulty: 2, calories: 328, calculationItems: ['番茄 2 个', '鸡蛋 2 个'],
  ingredients: ['番茄', '鸡蛋'], steps: ['洗净', '炒熟'], notesHtml: '<ul><li>少放盐</li></ul>'
}

test('all templates render distinct safe article content and real QR URL', () => {
  const contents = TEMPLATES.map(({ id }) => {
    const article = buildArticle(recipe, 'https://example.test/qr?a=1&b=2', id)
    assert.equal(article.templateId, id)
    assert.match(article.content, /番茄 2 个/)
    assert.match(article.content, /洗净/)
    assert.match(article.content, /长按识别小程序码/)
    assert.match(article.content, /qr\?a=1&amp;b=2/)
    assert.doesNotMatch(article.content, /<示例菜>/)
    return article.content
  })
  assert.equal(new Set(contents).size, TEMPLATES.length)
  assert.throws(() => buildArticle(recipe, '', 'invalid'), /有效的文章模板/)
})
