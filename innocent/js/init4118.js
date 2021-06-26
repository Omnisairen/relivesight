/* Light YouTube Embeds by @labnol */
/* Web: http://labnol.org/?p=27941 */

function ytlt(ele) {
  var iframe = document.createElement("iframe");
  iframe.setAttribute("src", ele.dataset.url);
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("rel", "0");
  iframe.setAttribute("allow", "autoplay; encrypted-media");
  iframe.setAttribute("allowfullscreen", "1");
  var div = ele.parentNode;
  while (div.firstChild) { div.removeChild(div.firstChild); }
  div.appendChild(iframe);
}

var soundsOpen = [], soundsClose = [], muted = false;
function randPlay(ary) {
  if (!muted) {
    var s = ary[Math.floor(Math.random() * ary.length)];
    if (s) {
      s.volume = 0.02;
      s.play();
    }
  }
}

function setupPosts(ele) {
  var speed = 1100, offset = 0;
  var posts = $(ele);
  posts.find(".hslink").on('click', (ev) => {
    ev.preventDefault();
    zrip(ev.target);
  });
  var fr = posts.hasClass('focus') ?
    posts.find('iframe')[0] :
    posts.find(".focus iframe")[0]
  if (fr) {
    fr.srcdoc = fr.srcdoc.replace(/data-src=/g, 'src=')
  }
  posts.find("a[href^='#']").click(function(ev) {
    ev.preventDefault();
    var ele = $(this).attr("href");

    var dest = $(ele).offset().top + offset;
    $("html:not(:animated), body:not(:animated)").animate({scrollTop: dest}, 1100);
    return false;
  });
}

var firstLoc = null, lastLoc = null;
var lastTop = 0;
function zloadrip(ele, div) {
  lastLoc = window.location.href;

  // no content? follow link
  var p = $(div)
  if (p.hasClass('no-rip'))
    return true;

  // history
  var inf = InfiniteScroll.data('#blog');
  if (inf) {
    if (firstLoc != null) {
      inf.setHistory(firstLoc[0], firstLoc[1]);
      window.history.pushState("", "", ele.href);
      firstLoc = null;
    } else {
      inf.setHistory("", ele.href);
    }
    inf.disableScrollWatch();
    inf.bindHistoryAppendEvents(false);
  }

  // anim
  var fence = $('#fence');
  fence.css({"z-index": 99});
  var oldfocus = fence.next();
  if (!oldfocus.hasClass('ground'))
    oldfocus.after(fence);
  else
    fence.addClass("appear");

  lastTop = Math.floor(p.offset().top);
  let cp = p.clone()
  cp.removeAttr('id').addClass('focus').css({top: lastTop + "px", "z-index": 99});
  setupPosts(cp)
  cp.insertAfter(fence);
  cp.css({top: (window.scrollY + 40) + "px", opacity: "1",
    transform: "scale(1) skew(0deg)", transition: "all 1s"});

  randPlay(soundsOpen);
  return false;
}

function loadpost(id, href, fn) {
  // if the object isn't loaded yet, get it
  var p = document.querySelector('#hsid-' + id);
  if (p)
    return fn(p);
  $.get(href, (data) => {
    let html = $.parseHTML(data), div = null;
    $.each(html, (i, el) => {
      if (el.nodeName == "DIV") {
        div = el.querySelector("#hsid-" + id);
        if (div) {
          $('#hsCache').append(div);
          return fn(div);
        }
      }
    })
    if (!div)
      return fn(null);
  })
}

function zrip(ele) {
  loadpost(ele.dataset.id, ele.href, function (p) {
    if (p)
      zloadrip(ele, p);
    else
      window.location = ele.href;
  })
}

function zunrip() {
  var inf = InfiniteScroll.data('#blog');
  if (inf) {
    inf.setHistory("", lastLoc);
    inf.enableScrollWatch();
    inf.bindHistoryAppendEvents(true);
  }
  var fence = $("#fence")
  var focus = fence.next();
  var oldfocus = fence.prev();
  if (oldfocus.hasClass('focus'))
    oldfocus.before(fence);
  else
    fence.removeClass("appear");
  focus.css({top: lastTop + "px", opacity: "0",
    transform: "scale(0) skew(15deg)"});
  window.speechSynthesis.cancel()
  randPlay(soundsClose);
  setTimeout(function () {
    focus.remove();
  }, 1000);
}

function spkr(ele) {
  var img = ele.children[0];
  if (img.src.endsWith("/speaker.png")) {
    img.src = "/images/speaker-mute.png";
    localStorage.setItem("mute", true);
    muted = true;
  } else {
    img.src = "/images/speaker.png";
    localStorage.removeItem("mute");
    muted = null;
  }
  return false;
}

$(document).ready(function () {
  firstLoc = [document.title, window.location.href];
  var lastLoc = firstLoc[1];

  // setup post loading
  $('body').append("<div id='hsCache' style='display:none'></div>")
  setupPosts(document)

  // setup parallax scrolling
  var pinned = $('#blog .pinned-post')
  if (pinned.length > 0)
    $('#intro').css('margin-top', 30 + pinned.height());
  $(window).on('scroll', function (e) {
    var scrolled = $(window).scrollTop();
    var opac = 1.0-Math.max(0.0, Math.min(1.0, ((scrolled - 10) / 500)));
    var lopac = 1.0-Math.max(0.0, Math.min(1.0, ((scrolled - 300) / 1200)));
    var bg = [130 + (89 * lopac), 217 + (75 * lopac), 205 + (50 * lopac)];
    $('#boxes').css('top', (0-(scrolled * 0.40)) + 'px');
    $('#intro').css('opacity', opac).css('transform', 'scale(' + ((opac + 4.0) * 0.2) + ')');
    if (scrolled > 2000 && scrolled < 3700) {
      $('body').css('background', 'url(/images/static.gif) repeat');
    } else if (scrolled > 5000 && scrolled < 6700) {
      $('body').css('background', 'url(/images/pond.gif) no-repeat center/cover fixed');
    } else if (scrolled > 8000 && scrolled < 9700) {
      $('body').css('background', scrolled % 2 == 0 ? 'red' : 'purple');
    } else if (scrolled > 9700) {
      $('body').css('background', scrolled % 2 == 0 ? '#ABE' : '#BAE');
    } else {
      $('body').css('background', 'rgb(' + bg.join(', ') + ') url("/images/surface.gif") repeat-x');
    }
  });

  // setup infinite scrolling
  $('#blog').infiniteScroll({
    hideNav: '.pagination',
    append: '#blog > div',
    path: '.next'
  }).on('load.infiniteScroll', (ev, resp) => {
    setupPosts(resp)
  });

  // setup search form
  var searchInProgress = null;
  var searchResultId = 0;
  var blogStore = null;
  var searchFn = function () {
    var terms = $(this).val();
    if (searchInProgress) {
      clearTimeout(searchInProgress);
      searchResultId++;
    }
    if (terms.length == 0) {
      if (blogStore) {
        $('#blog > div:not(#hsid--pinned)').remove();
        $('#blog .search').after(blogStore.children());
        blogStore.remove();
        blogStore = null;
      }
    } else {
      searchInProgress = setTimeout(function () {
        $('#blog').infiniteScroll('destroy');
        $('.pagination').remove();

        let searchId = searchResultId, loaded = 0;
        let results = window.elasticlunr.index.search(terms,
          {fields: {title: {boost: 2}, content: {boost: 1}}});
        let loadfn = function () {
          var blogposts = $('#blog > div:not(#hsid--pinned)');
          if (!blogStore) {
            blogStore = $("<div></div>").append(blogposts);
            $('#hsCache').append(blogStore);
          } else {
            blogposts.remove();
          }
          if (loaded > 0) {
            results[0].prepend(`<div class="search-results">${results.length} posts found.</div>`)
            for (let j = loaded - 1; j >= 0; j--) {
              $('#blog .search').after(results[j]);
            }
          }
        }
        if (results.length == 0) {
          return loadfn();
        }
        for (let i = 0; i < results.length; i++) {
          if (searchId == searchResultId) {
            let post = window.elasticlunr.ids[results[i].ref];
            loadpost(post[0], "/" + post[1], function (p) {
              loaded++;
              p = $("<div class='post'></div>").append($(p).clone());
              setupPosts(p);
              results[i] = p;
              if (loaded == results.length) {
                loadfn();
              }
            })
          }
        }
      }, 500);
    }
  }
  $('#search-input').keydown(e => {if (e.which === 13) { e.preventDefault() }})
    .keyup(searchFn).on('input', searchFn);

  // load sound effects
  soundsOpen.push(new Audio("/images/sound0.mp3"));
  soundsOpen.push(new Audio("/images/sound2.mp3"));
  soundsOpen.push(new Audio("/images/sound3.mp3"));
  soundsOpen.push(new Audio("/images/sound7.mp3"));
  soundsClose.push(new Audio("/images/sound1.mp3"));
  soundsClose.push(new Audio("/images/sound4.mp3"));
  soundsClose.push(new Audio("/images/sound5.mp3"));
  soundsClose.push(new Audio("/images/sound6.mp3"));

  // load speaker toggle
  try {
    muted = localStorage.getItem("mute");
  } catch (e) {
    muted = true;
  }

  // add mute button
  $("#intro .byline").append('<div id="speaker"><a href="" onclick="return spkr(this)"><img src="/images/speaker' +
     (muted ? "-mute" : "") + '.png"></a></div>');
});
