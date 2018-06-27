Arckane.model('recycling').events.extend({
	show: {
		item: function (e) {
			var current = this.model.game.data.current,
				el = this.subsets.get(current.index);

			if (!el) return false;

			el.attr({
				style: this.model.game.config.item.tmpl.attr.style
			});

			this.model.DOM.find('mask').append(el);
			this.model.DOM.find('falcon').trigger('say', current.name);
		}
	},
	put: {
		item: function (e) {
			var data = e.triggerData,
				el = this.subsets.get(this.model.game.data.current.index);

			if (!data) return this;

			data.box.append(el.css({
				top: data.top + 'px',
				left: data.left + 'px'
			}));

			this.model.trigger('check', el.i);
		}
	},
	say: {
		falcon: function (e) {
			e.triggerData ? this.txt(this.model.models.find('lang').get(e.triggerData)) : false;
		}
	},
	click: {
		box: function (e) {
			if (this.model.game.data.found.size() == this.model.game.data.total) return this;

			var item = this.model.DOM.find('item').subsets.get(this.model.game.data.current.index),
				falcon = this.model.game.config.falcon,
				check = item.type == this.dataset.type;

			check ? item.trigger('put', {
				box: this,
				top: -30,
				left: 42.5
			}) : false;

			this.model.DOM.find('falcon').trigger('say', check ? falcon.correct : falcon.error);

			if (check) {
				this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;
			} else {
				this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;
			}

			setTimeout(function () {
				item.trigger('show');
			}, falcon.speed);
		}
	},
	reset: {
		box: function (e) {
			var items = this.q('img', function (el) {
				return el.type;
			});

			this.each(items.tagName ? [items] : items, function (el) {
				el.remove();
			});
		}
	},
	lang: {
		falcon: function (e) {
			this.txt(this.model.models.find('lang').get(this.textContent));
		}
	},
	this: {
		langChange: function (e) {
			this.DOM.trigger('lang', e.triggerData, true, true);
		},
		init: function (e) {
			this.game.data.total = this.game.config.limit[this.game.level];
			this.game.data.set('current', Object.create(this.proto));

			this.game.data.on('setCurrent', function () {
				var levels = this.parent.levels[this.parent.level],
					total = this.size(levels),
					i = Math.floor(Math.random() * total);

				if (this.found.size() != this.total) {
					do {
						i = Math.floor(Math.random() * total);
					} while (this.found.find('el-' + i));

					this.current.extend({
						index: i,
						name: this.parent.levels[this.parent.level][i].name
					});
				}
			});
		},
		check: function (e) {
			this.game.data.found.set(e.triggerData, {
				time: this.game.timer.time
			});
			this.game.data.trigger('setCurrent');
		},
		level: function (e) {
			this.DOM.unset('item');
			this.DOM.trigger('reset', false, true, true);
		},
		next: function (e) {
			this.trigger('start', true);
		},
		start: function (e) {
			var el,
				items = this.game.levels[this.game.level],
				item = this.game.config.item,
				mask = this.DOM.fromConfig(this.game.config.mask),
				load = function (e) {
					this.model.DOM.find('original').removeClass('hide');
					this.model.DOM.find('mask').attr({
						style: false
					});
					this.model.DOM.find('item').trigger('show');
				};

			if (!this.DOM.find('mask')) {
				this.DOM.set('mask', mask, true);
				this.game.view.set('index', mask, true);
				this.models.find('index').query(mask);

				this.DOM.find('original').on('load', load, true);
			}

			this.each(items, function (ec, i) {
				item.tmpl.attr.src = item.dir + ec.src;
				el = this.DOM.fromConfig(item.tmpl);

				el.define({
					i: 'el-' + parseInt(i),
					type: ec.type
				});

				this.DOM.set('item', el);
			}, function () {
				this.DOM.setEvents({
					list: ['item']
				});

				this.game.data.trigger('setCurrent');

				e.triggerData ? this.DOM.find('item').trigger('show') : false;
			});
		}
	}
});