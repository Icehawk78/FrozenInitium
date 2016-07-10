function parseData(key, default) {
  var value = localStorage.getItem(key);
  if (typeof(value) == 'undefined' || value == null) {
    storeData(key, default);
    value = default;
  } else {
    value = JSON.parse(value);
  }
  return value;
}

function storeData(key, value) {
  localStorage.putItem(key, JSON.stringify(value));
}


var characterName = $('[rel=#profile]').text();
$.get($('.character-display-box').find('a').first().attr('rel'), function(res) {
  var response = $($.parseHTML(res));
  var currentStats = {
    str: parseFloat(response.find('[name=strength]').text().split(' ')[0]),
    dex: parseFloat(response.find('[name=dexterity]').text().split(' ')[0]),
    int: parseFloat(response.find('[name=intelligence]').text().split(' ')[0])
  };
  var myStats = parseData(characterName, 
})
