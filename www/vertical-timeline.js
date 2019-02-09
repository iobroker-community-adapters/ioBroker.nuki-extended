/*
 * Credits to Sebastiano Guerriero
 * Source: https://codyhouse.co/gem/vertical-timeline/
 *
 */
function Timeline(tSelector, tOffset)
{
	this.selector = tSelector || '.cd-timeline-block';
	this.offset = tOffset || 0.8;
	
	this.hideBlocks = function()
	{
		$(this.selector+' .cd-timeline-img, '+this.selector+' .cd-timeline-content').removeClass('bounce-in').addClass('is-hidden');
		//this.showBlocks();
		return this;
	};
	
	this.showBlocks = function()
	{
		var app = this;
		$.each($(this.selector), function()
		{
			if ($(this).offset().top <= $(window).scrollTop()-(-$(window).height()*app.offset))
				($(this).find('.cd-timeline-img').hasClass('is-hidden')) && app.bounceIn($(this));
			else
				return;
		});
		
		return this;
	};
	
	this.bounceIn = function(el)
	{
		var pic = el.find('.cd-timeline-img');
		if (pic.attr('data-img')) pic.css('background-image', 'url('+pic.attr('data-img')+')');
		el.find('.cd-timeline-img, .cd-timeline-content').removeClass('is-hidden').addClass('bounce-in');
		return this;
	};
	
	this.bindScroll = function(el)
	{
		var app = this;
		$(window).on('scroll', function(){
			(!window.requestAnimationFrame) ? setTimeout(function() {app.showBlocks()}, 100) : window.requestAnimationFrame(function() {app.showBlocks()});
		});
		
		return this;
	};
};