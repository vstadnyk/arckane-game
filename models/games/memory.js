Arckane.model('memory', {
	items: function(fn) {
		var el,
			items = this.game.levels[this.game.level],
			tmpl = this.game.config.tmpl;
			
		this.each(items.concat(items), function(ec) {
			tmpl.item.child[0].attr.src = tmpl.dir + ec.src;
			
			el = this.DOM.fromConfig(tmpl.item);
			el.define({
				tile: tmpl.tile,
				src: ec.src,
				advice: ec.advice
			});

			this.DOM.set('item', el);
		}, function() {
			this.DOM.setEvents({
				list: ['item']
			});
			
			this.game.data.trigger('levelShuffle');
			
			fn.call(this);
		});
	}
}).events.extend({
	load: {
		falcon: function(e) {
			setTimeout(function(item) {
				item.trigger('say', 'select');
			}, 1000, this);
		}
	},
	show: {
		item: function(e) {
			this.each(this.model.game.data.show, function(i) {
				this.model.DOM.find('grid').append(this.subsets.find(i));
			});
		}
	},
	say: {
		falcon: function(e) {
			var txt = e.triggerData,
				config = this.model.game.config.falcon;
			
			if (!txt) return;
			
			this.txt(config[txt] || txt);
		}
	},
	click: {
		item: function(e) {
			var speed = this.model.game.config.animation.speed;

			this.addClass('flipped');
			
			this.model.DOM.find('falcon').trigger('say', 'next');

			setTimeout(function(item) {
				item.q('div').css({
					backgroundImage: 'url(' + item.q('img').src + ')'
				});
			}, speed / 2, this);
			
			setTimeout(function(item) {
				item.model.trigger('check', item);
			}, speed, this);
		}
	},
	tile: {
		item: function(e) {
			if (this.model.game.current.find(this.src)) return;
			
			this.removeClass('flipped').q('div').css({
				backgroundImage: 'url(' + this.tile + ')'
			});
		}
	},
	reset: {
		item: function(e) {
			this.remove();
			this.parent.unset(this._name);
		}
	},
	this: {
		check: function(e) {
			var item = e.triggerData;
			
			this.game.showed += 1;
			
			this.game.current.set(item.src, {
				time: this.game.timer.time
			});
			
			if (this.game.showed && this.game.showed == 2) {
				this.game.showed = 0;
				
				this.each(this.game.current, function(v, i) {
					v.subsets.size() != 2 ? this.game.current.unset(i) : false;
				});
				
				if (this.game.current.size()) {
					if (this.game.current.find(item.src)) {
						this.DOM.find('falcon').trigger('say', item.advice);
						
						this.game.data.found.set(item.src, {
							time: this.game.timer.time
						});

						this.game.audio.DOM.find('applause') ? this.game.audio.DOM.find('applause').stop().play() : false;
					} else {
						this.DOM.find('falcon').trigger('say', 'error');

						this.game.audio.DOM.find('oops') ? this.game.audio.DOM.find('oops').stop().play() : false;
					}					
					
					setTimeout(function(item) {
						item.trigger('say', 'select');
					}, 2000, this.DOM.find('falcon'));
				} else{
					this.DOM.find('falcon').trigger('say', 'error');
					this.game.audio.DOM.find('oops') ? this.game.audio.DOM.find('oops').stop().play() : false;
				}

				this.DOM.find('item') ? this.DOM.find('item').trigger('tile', false, true) : false;
			}
		},
		init: function(e) {
			this.game.data.total = this.size(this.game.levels[this.game.level]);
			
			this.game.set('showed', 0);
			this.game.set('current', Object.create(this.proto));
			
			this.game.data.on('levelShuffle', function() {
				var i,
					c,
					aa = [],
					tmp,
					a = this.keys(this.parent.levels[this.parent.level]);

				c = a.length * 2;
				a = a.concat(a);
				
				this.each(a, function(v, k) {
					aa.push(k);
				});
				
				while (0 !== c) {
					i = Math.floor(Math.random() * c);
					c -= 1;

					tmp = aa[c];
					aa[c] = aa[i];
					aa[i] = tmp;
				}

				this.show = aa;
			});
		},
		level: function(e) {
			this.DOM.find('falcon').trigger('say', 'finish');
			
			this.DOM.trigger('reset', false, true, true);
		},
		next: function(e) {
			this.game.data.total = this.size(this.game.levels[this.game.level]);
			
			this.game.set('showed', 0);
			this.game.set('current', Object.create(this.proto));
			
			this.trigger('start', true);
		},
		start: function(e) {
			var mask = this.DOM.fromConfig(this.game.config.mask),
				load = function(e) {
					this.removeClass('hide').model.DOM.find('mask').attr({
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
			
			this.items(function() {
				e.triggerData ? this.DOM.find('item').trigger('show') : false;
			});
		}
	}
});