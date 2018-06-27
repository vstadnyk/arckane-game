Arckane.model('games', {
	init: function () {
		'use strict';

		var gameModel,
			proto = this.proto;

		this.set('game', Object.create(proto));

		this.game.set('events', Object.create(proto).extend(this.events.game));
		this.game.setEvents();

		this.each(this.config.list, function (gameConfig, gameName) {
			gameModel = this.models.find(gameName);

			if (!gameModel) return;

			this.game.set('config', Object.create(proto).extend(gameConfig));
			this.game.set('modal', this.models.find('modal'));
			this.game.append('model', gameModel);

			this.game.set('data', Object.create(proto).extend({
				total: 0,
				events: this.events.data
			})).setEvents();

			this.game.data.set('found', Object.create(proto));

			this.game.data.found.on('onSet', function (e) {
				this.size() == this.parent.total ? e.eventData.game.trigger('level') : false;
			}, this);

			this.game.data.found.on('onChange', function (e) {
				e.eventData.DOM.find('points').trigger('change');
			}, this);

			this.game.set('timer', Object.create(proto).extend({
				i: 0,
				total: 0,
				events: this.events.timer,
			})).setEvents();

			this.game.set('audio', Object.create(proto).extend({
				loaded: 0,
				DOM: Object.create(this.DOM),
				events: this.events.audio
			})).setEvents();

			gameModel.set('game', this.game);

			this.game.trigger('get');
		});
	}
}).events.extend({
	load: {
		level: function (e) {
			this.trigger('change');
		},
		levelComplete: function (e) {
			this.trigger('change');
		},
		points: function (e) {
			this.trigger('change');
		},
		timer: function (e) {
			this.trigger('change');
		},
		totalTime: function (e) {
			var date = new Date(0);

			date.setSeconds(this.model.game.timer.total);

			this.txt((date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes()) + ':' + (date.getUTCSeconds() < 10 ? '0' + date.getUTCSeconds() : date.getUTCSeconds()));
		},
		audio: function (e) {
			this.trigger('change');
		},
		body: function (e) {
			this.trigger('lang');
		}
	},
	start: {
		body: function (e) {
			this.empty().addClass('load').attr({
				style: false
			}).append(this.model.game.view.index);
		},
		level: function (e) {
			this.trigger('change');
		},
		levelComplete: function (e) {
			this.trigger('change');
		},
		points: function (e) {
			this.trigger('change');
		},
		toggle: function (e) {
			this.datasets({
				run: true
			}).trigger('change');
		}
	},
	change: {
		level: function (e) {
			this.txt(this.model.game.level);
		},
		levelComplete: function (e) {
			this.innerHTML = this.model.models.find('lang').get(this.textContent)[this.model.game.level];
		},
		points: function (e) {
			this.model.game.data.trigger('getPoints');
			this.txt(this.model.game.points);
		},
		timer: function (e) {
			this.txt(this.model.game.timer.time);
		},
		audio: function (e) {
			if (!this.model.game.config.audio) return this.addClass('hide');

			this.removeClass('hide');

			!this.model.game.audio.config.mute ? this.q('a').removeClass('disabled') : this.q('a').addClass('disabled');
		},
		toggle: function (e) {
			this.q('span').removeClass('hide');

			this.dataset.run ? this.q('.start').addClass('hide') : this.q('.stop').addClass('hide');
		}
	},
	lang: {
		body: function (e) {
			var b = this,
				img = new Image(),
				poster = this.model.models.find('lang').get('game_poster');

			if (poster == 'game_poster') return this.attr({
				style: false
			}).addClass('load');

			img.src = poster;

			img.onload = function () {
				b.css({
					height: this.height + 'px'
				});
			}

			this.removeClass('load').css({
				backgroundImage: 'url("' + poster + '")'
			});
		}
	},
	finish: {
		body: function (e) {
			this.empty().trigger('load');
		},
		toggle: function (e) {
			this.datasets({
				run: false
			}).trigger('change');
		}
	},
	click: {
		start: function (e) {
			this.model.game.modal.trigger('close');
			this.model.game.trigger('start');
		},
		toggle: function (e) {
			if (!this.dataset.run) return this.model.game.trigger('start');

			this.model.game.trigger('stop');
			this.model.game.trigger('modal', 'stop');

			this.model.game.audio.DOM.find('stop') ? this.model.game.audio.DOM.find('stop').play() : false;
		},
		next: function (e) {
			this.model.game.modal.trigger('close');
			this.model.game.trigger('next');
		},
		about: function (e) {
			this.model.game.trigger('modal', 'about');
		},
		audio: function (e) {
			var mute = this.model.game.config.audio.mute;

			this.model.game.config.audio.mute = mute ? false : true;

			this.trigger('change');
			this.model.game.audio.trigger('mute');
		}
	},
	this: {
		DOMLoad: function (e) {
			this.init();
		},
		langChange: function (e) {
			this.DOM.trigger('lang', e.triggerData, true, true);
		}
	},
	data: {
		this: {
			getPoints: function (e) {
				this.parent.points = this.found.size() + '/' + this.total;
			},
			reset: function (e) {
				this.found.empty();
			}
		}
	},
	audio: {
		error: {
			player: function (e) {
				log(e)
			}
		},
		this: {
			get: function (e) {
				var fn = e.triggerData;

				this.each(this.config.events, function (item, name) {
					item.on ? this.trigger('load', {
						item: name,
						fn: fn || function () {}
					}) : false;
				});
			},
			load: function (e) {
				var o = e.triggerData,
					config = this.config,
					player = config.player,
					item = config.events[o.item];

				this.parent.parent.ajax({
					url: item.src,
					contentType: 'audio/mpeg',
					done: function (r) {
						this.game.audio.loaded += 1;

						if (this.game.audio.loaded == this.size(this.game.audio.config.events)) {
							o.fn.call(this.game, item);
						}

						player.attr.src = item.src;
						player.attr.autoplay = !config.mute && item.autoplay;
						player.attr.loop = item.loop;

						this.game.audio.DOM.set(o.item, this.DOM.fromConfig(player)).define({
							stop: function () {
								this.pause();
								this.currentTime = 0;

								return this;
							}
						});
					}
				});
			},
			mute: function (e) {
				var player = this.DOM.find('track');

				if (!player) return;

				player.paused ? player.play() : player.pause();
			}
		}
	},
	timer: {
		this: {
			start: function (e) {
				var date;

				clearInterval(this.interval);

				this.interval = setInterval(function (timer) {
					date = new Date(0);

					timer.i++;

					date.setSeconds(timer.i);

					timer.time = (date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes()) + ':' + (date.getUTCSeconds() < 10 ? '0' + date.getUTCSeconds() : date.getUTCSeconds());

					timer.parent.parent.DOM.find('timer').trigger('change');
				}, 1000, this);
			},
			stop: function (e) {
				this.total += this.i;
				clearInterval(this.interval);
				this.parent.parent.DOM.find('timer').trigger('change');

			},
			reset: function (e) {
				this.i = 0;
				this.time = '00:00';
				this.trigger('stop');
			}
		}
	},
	game: {
		this: {
			get: function (e) {
				this.parent.ajax({
					url: '/data/games/' + this.config.data,
					contentType: 'json',
					done: function (config) {
						this.game.config.extend(config);
						this.game.set('view', Object.create(this.proto));

						this.each(this.game.config.view, function (file, name) {
							this.ajax({
								url: '/view/games/' + file,
								done: function (html) {
									this.game.view.set(name, html);

									this.game.view.size() == this.size(this.game.config.view) ? this.game.trigger('init') : false;
								}
							});
						});
					}
				});
			},
			init: function (e) {
				this.config.level ? this.set('level', this.config.level) : false;
				this.config.levels ? this.set('levels', this.config.levels) : false;

				if (!this.config.audio) return this.trigger('getView');

				this.audio.set('config', this.config.audio);

				this.audio.trigger('get', function () {
					this.trigger('getView');
				});
			},
			getView: function (e) {
				var lang = this.parent.models.find('lang');

				lang.setDic(this.config.dic);

				this.parent.ajax({
					url: '/view/games/' + this.parent.config.view,
					done: function (html) {
						this.game.model.trigger('init');

						this.DOM.find('index').removeClass('load');
						this.ajax().responseHTML(html, this.DOM.find('index'));
						this.game.trigger('modal', 'start');

						lang.trigger('DOMLoad');
					}
				});
			},
			reset: function (e) {
				this.level = this.config.level;
				this.levels = this.config.levels;

				this.parent.DOM.trigger('finish', false, true, true);

				this.timer.trigger('reset');
				this.data.trigger('reset');

				this.view.unset('index');

				this.model.trigger('stop, init');
				this.model.DOM.empty();

				this.parent.DOM.trigger('change', false, true, true);
			},
			modal: function (e) {
				this.modal.init('/view/games/' + this.config.view[e.triggerData], {
					close: function () {
						e.triggerData == 'stop' || e.triggerData == 'finish' ? e.target.trigger('reset') : false;

						return true;
					}
				}).trigger('open');
			},
			start: function (e) {
				this.model.trigger('start');
				this.timer.trigger('start');
				this.parent.DOM.trigger('start', false, true, true);
			},
			stop: function (e) {
				this.timer.trigger('stop');
				this.parent.DOM.trigger('stop', false, true, true);
			},
			level: function (e) {
				this.timer.trigger('stop');

				if (this.level == this.size(this.levels)) {
					this.model.trigger('finish');

					this.trigger('modal', 'finish');

					this.model.game.audio.DOM.find('winning') ? this.model.game.audio.DOM.find('winning').play() : false;
				} else {
					this.trigger('modal', 'next');
					this.model.trigger('level');
					this.parent.DOM.trigger('level', false, true, true);
				}

				this.parent.DOM.trigger('stop', false, true, true);
			},
			next: function (e) {
				this.level += 1;
				this.timer.trigger('reset, start');
				this.data.trigger('reset');
				this.model.trigger('next');
				this.parent.DOM.trigger('start', false, true, true);
			}
		}
	}
});