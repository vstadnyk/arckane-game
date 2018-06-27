Arckane.model('lang', {
	get: function (key) {
		return this.find(key, this.dic[this.current] || []) || key;
	},
	setDic: function (dic) {
		if (typeof dic != 'object') return;

		this.dic.each(function (v, l) {
			dic[l] ? this.extend(dic[l], v) : false;
		});
	}
}).events.extend({
	click: {
		switcher: function (e) {
			this.model.trigger('change', this.textContent);

			this.txt(this.one(false, this.filter(function (i) {
				return i != this.textContent;
			}, this.keys(this.model.config.dic))));
		}
	},
	translate: {
		string: function (e) {
			!this.pattern ? this.extend({
				pattern: this.textContent
			}) : false;

			this.textContent = this.model.get(this.pattern);
		},
		html: function (e) {
			!this.pattern ? this.extend({
				pattern: this.textContent
			}) : false;

			this.innerHTML = this.model.get(this.textContent);
		}
	},
	this: {
		DOMLoad: function (e) {
			!this.current ? this.set('current', this.config.current) : false;
			!this.dic ? this.set('dic', this.config.dic) : false;

			this.DOM.trigger('translate', false, true, true);
		},
		change: function (e) {
			var key = e.triggerData;

			if (!key || !this.config.dic[key]) return;

			this.current = key;
			this.trigger('DOMLoad');

			this.models.trigger('langChange', this.current, true, true);
		}
	}
});