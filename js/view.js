if(localStorage.getItem('node'))
{
	golos.config.set('websocket', localStorage.getItem('node'));
}
else
{
	golos.config.set('websocket','wss://ws.golos.io/');
}
var globalVars = new Object();
var article = new Object();
var user = new Object();
var startAuthor;
var startPermlink;
user.following = [];
user.followers = [];
//Init();

function removeChildrenRecursively(node)
{
    if (!node) return;
    while (node.hasChildNodes()) {
        removeChildrenRecursively(node.firstChild);
        node.removeChild(node.firstChild);
    }
}

function spoiler(elem)
{
    style = document.getElementById(elem).style;
    style.display = (style.display == 'block') ? 'none' : 'block';
}

function explode( delimiter, string ) {	// Split a string by string
	// 
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: kenneth
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)

	var emptyArray = { 0: '' };

	if ( arguments.length != 2
		|| typeof arguments[0] == 'undefined'
		|| typeof arguments[1] == 'undefined' )
	{
		return null;
	}

	if ( delimiter === ''
		|| delimiter === false
		|| delimiter === null )
	{
		return false;
	}

	if ( typeof delimiter == 'function'
		|| typeof delimiter == 'object'
		|| typeof string == 'function'
		|| typeof string == 'object' )
	{
		return emptyArray;
	}

	if ( delimiter === true ) {
		delimiter = '1';
	}

	return string.toString().split ( delimiter.toString() );
}

function getPostingKey()
{
	var login = localStorage.getItem('login');
	if(login)
	{
		var pk = sjcl.decrypt(login, localStorage.getItem(login));
		return pk;
	}
	else
	{
		return false;
	}
}	

function getPostingKeyByLogin(login)
{
	var pk = sjcl.decrypt(login, localStorage.getItem(login));
	return pk;
}	

function isLoggedIn()
{
	if(getPostingKey() && localStorage.getItem('login'))
	{
		return true;
	}
	return false;
}

function getFollowersCount()
{
	var login = localStorage.getItem('login');
	golos.api.getFollowCount(login, function(err, data){
		console.log(err, data);
	});
}

function getFollowers(login, start, me)
{
	golos.api.getFollowers(login, start, 'blog', 100, function(err, data){
		//console.log(err, data);
		if(data && data.length > 1 && me == true){
			var i = user.followers.length - 1;
			var latest = '';
			if(start != '')
			{
				data.shift();
			}
			data.forEach(function (operation){
				i++;
				user.followers[i] = operation.follower;
				//console.log(i, operation.follower);
				latest = operation.follower;
			});
			getFollowers(login, latest, me);
		}
	});
}

function getFollowersMe()
{
	var login = localStorage.getItem('login');
	golos.api.getFollowers(login, '', 'blog', 100, function(err, data){
		//console.log(err, data);
		if(data && data.length > 0)
		{
			var i = 0;
			var latest = '';
			data.forEach(function (operation){
				i++;
				user.followers[i] = operation.follower;	
				//console.log(i, operation.follower);
				latest = operation.follower;				
			});
			if(latest != '' && data.length == 100)
			{
				getFollowers(login, latest, true);
			}
			
		}else{
			console.log(err);
		}
	});
}

function getFollowing(login)
{
	golos.api.getFollowing(login, '', 'blog', 100, function(err, data){
		//console.log(err, data);
	});
}

function getFollowingMe()
{
	var login = localStorage.getItem('login');
	golos.api.getFollowing(login, '', 'blog', 100, function(err, data){
		if(data)
		{
			var i = 0;
			data.forEach(function (operation){
				user.following[i] = operation.following;	
				i++;
			});
			//console.log(user.following);
		}else{
			console.log(err);
		}
		
	});
}

function votePost(power, permlink, author)
{
	voter = user.login;
	var weight = power * 100;
	var key = localStorage.getItem(voter);
	if(key == '')
	{
		alert('Кажется вам нужно еще раз ввести постинг ключ.');
		return;
	}
	var pk = sjcl.decrypt(voter, key);
	document.getElementById('vote_form').style = 'display: none';
	golos.broadcast.vote(pk, voter, author, permlink, weight, 
		function(err, result) {
			 //console.log(err, result);
			 if(result)
			 {				
				updateVotes(permlink, author);
				isVoted(permlink, author, voter);
			 }
			 else{
				  console.log(err);
			 }
		});
}

function AddBlockX(operation)
{
	var listWrapper = document.getElementById('items_list_wrapper');
	var main_div = document.createElement("div");
	if(localStorage.getItem('open') == 'true')
	{
		main_div.classList.add("col-xs-6","r_wrapper");
	}
	else
	{
		main_div.classList.add("col-xs-12","q_wrapper");
	}
	
	var metadata = JSON.parse(operation.json_metadata);
	if(metadata.image)
	{
		var image = metadata.image[0];
	}
	else
	{
		var image = 'images/noimage.png';
	}
	var img_div = document.createElement("div");
	img_div.classList.add("img_div");
	main_div.appendChild(img_div);
	if(image == undefined || image == 'images/noimage.png')
	{
		img_div.style.backgroundImage = "url('images/noimage.png')";
	}
	else
	{
		img_div.style.backgroundImage = "url('https://imgp.golos.io/256x256/"+image+"')";
	}
	
	
	var q_div = document.createElement("div");
	q_div.classList.add("q_div");
	main_div.appendChild(q_div);
	
	var title = operation.title;
	var author = operation.author;
	startAuthor = operation.author;
	startPermlink = operation.permlink;
	var created = operation.created;
	var last_update = operation.last_update;
	var total_payout_value = operation.total_payout_value;
	var pending_payout_value = operation.pending_payout_value;
	var total_pending_payout_value = operation.total_pending_payout_value;
	var votes = operation.active_votes.length;
	var vl = total_pending_payout_value;
	if(total_payout_value > total_pending_payout_value)
	{
		vl = total_payout_value;
	}

	var tags = '';
	if(typeof metadata.tags !== undefined)
	{
		var tags_count = metadata.tags.length;
		
		for(var i = 0;i < tags_count;i++)
		{
			if(tags_count > 1)
			{
				tags = tags + " <span class='label label-warning'><a href='tag.html?tag=" + metadata.tags[i] + "'>"+detransliterate(metadata.tags[i], 0)+'</a></span>';
			}
		}
	}	
	
	var dt = getCommentDate(created);
	
	var d1 = moment(created);// new Date(created);
	var d2 = moment(operation.cashout_time);//new Date(operation.cashout_time);
	var dco = d2.diff(d1, 'hours');
	if(localStorage.getItem('open') == 'true')
	{
		var s = '';
		var h = 'show.html?permlink='+operation.permlink.trim() +'&author='+operation.author.trim();
	}
	else
	{
		var s = 'onClick="getContentX(\''+operation.permlink.trim() +'\', \''+operation.author.trim() +'\');"';
		var h = 'javascript:void(0)';
	}
	
	q_div.innerHTML = '<div class="q_header_wrapper"><h3><a href="'+h+'" '+s+'>'+ title + '</a></h3></div>' +  dt +' - Автор: <a href="user.html?author='+ author +'" title="Все посты пользователя">@' + author + '</a>' + '<br/> Голосов <strong>' + votes + '</strong> на сумму <strong>' + vl + '</strong><br/>' + tags;
	
	var clearFix = document.createElement("div");
	clearFix.classList.add("clearFix");
	main_div.appendChild(clearFix); 
	listWrapper.appendChild(main_div);
}

function getDiscussionsByAuthor(author)
{
	document.getElementById('loader').style = 'display:block';
	 var params = 
	 {
		 'limit': 100,
		 'truncate_body': 40,
		 'select_authors': [author]
	 }
	 golos.api.getDiscussionsByCreated(params, function(err, data){
		if(data.length > 0)
		{	
			data.sort(compareDate);	
			for(operation of data)
			{
				//console.log(operation);
				AddBlockX(operation);
			}//);
		}
		document.getElementById('loader').style = 'display:none';
	 });
}

function getDiscussionsByBlog(author)
{
	document.getElementById('loader').style = 'display:block';
	 var params = 
	 {
		 'limit': 100,
		 "select_authors": [author],
	 }
	 golos.api.getDiscussionsByBlog(params, function(err, data){
		if(err)
		{
			console.log(err);
		}			
		if(data.length > 0)
		{	
			data.sort(compareDate);
			for(operation of data)
			{
				if(operation.author != author)
				{
					//console.log(operation);
					// !!! repost
				}
				
				AddBlockX(operation);
			}//);
		}
		document.getElementById('loader').style = 'display:none';
	 });
}

function getDiscussionsTrending() 
{
	document.getElementById('loader').style = 'display:block';
	golos.api.getDiscussionsByTrending({"limit": 100}, function(err, data){
		//console.log(err,data);
		
		if(data.length > 0)
		{			
			data.forEach(function (operation){
				AddBlockX(operation);
			});
		}
		document.getElementById('loader').style = 'display:none'; 
	});	
}

function getDiscussionsPopular(date)
{
	document.getElementById('loader').style = 'display:block';
	golos.api.getDiscussionsByHot({"limit": 100}, function(err, data){
		//console.log(err,data);
		
		if(data.length > 0)
		{			
			data.forEach(function (operation){
				AddBlockX(operation);
			});
		}
		document.getElementById('loader').style = 'display:none'; 
	});	
}

function compareDate(a, b)
{
	if(a.created > b.created)
	{
		return -1;
	}
	else{
		return 1;
	}
}

function getDiscussionsByTags(tags)
{
	document.getElementById('loader').style = 'display:block';
	 var params = 
	 {
		 'limit': 100,
		 'select_tags': tags,
		 'truncate_body': 20
	 }
	 //console.log(params);
	 golos.api.getDiscussionsByCreated(params, function(err, data){
		if(err)
		{
			console.log(err);
		}
		if(data)
		{
			data.sort(compareDate);
			if(data.length > 0)
			{			
				data.forEach(function (operation){
					AddBlockX(operation);
				});
			}
		}		
		document.getElementById('loader').style = 'display:none'; 
	 });
}

function getDiscussions(start_author, start_permlink)
{
     start_author = typeof start_author !== 'undefined' ?  start_author : '';
     start_permlink = typeof start_permlink !== 'undefined' ?  start_permlink : '';
     if(start_permlink && start_author)
     {
         var params = 
         {
             'limit': 100,
             'truncate_body': 240,
             'start_author': start_author,
             'start_permlink': start_permlink
         }     
     }
     else
     {
         var params = 
         {
             'limit': 100,
             'truncate_body': 240
         }
     }
     
     golos.api.getDiscussionsByCreated(params, function(err, data){
        if(data.length > 0)
        {			
            //data.forEach(function (operation)
			for(operation of data)
			{
                AddBlockX(operation);
            }//);
        }
		document.getElementById('loader').style = 'display:none'; 
     });
}

function getDiscussionsByFeed(login, start_author, start_permlink)
{
	document.getElementById('loader').style = 'display:block';
	 start_author = typeof start_author !== 'undefined' ?  start_author : '';
     start_permlink = typeof start_permlink !== 'undefined' ?  start_permlink : '';
	 //console.log(start_author, start_permlink);
     if(start_permlink && start_author)
     {
         var params = 
         {
             'limit': 100,
             'truncate_body': 240,
			 "select_authors": [login],
             'start_author': start_author,
             'start_permlink': start_permlink
         }     
     }
     else
     {
         var params = 
         {
			 "tag": "",
			 "select_authors": [login],
             'limit': 100,
             'truncate_body': 240
         }
     }
	golos.api.getDiscussionsByFeed(params, function(err, data){
		//console.log(err,data);
		data.sort(compareDate);
		if(data.length > 0)
		{			
			data.forEach(function (operation){
				AddBlockX(operation);
			});
		}
		document.getElementById('loader').style = 'display:none'; 
	});	
}

function prepareContent(text) {
	return text.replace(/[^=][^""][^"=\/](https?:\/\/[^" <>\n]+)/gi, data => {
	const link = data.slice(3);
	  if(/(jpe?g|png|svg|gif)$/.test(link)) return `${data.slice(0,3)} <img src="${link}" alt="" /> `
	  if(/(youtu|vimeo)/.test(link)) return `${data.slice(0,3)} <iframe src="${link}" frameborder="0" allowfullscreen></iframe> `;
	  return `${data.slice(0,3)} <a href="${link}">${link}</a> `
	}).replace(/ (@[^< \.,]+)/gi, user => ` <a href="user.html?author=${user.trim().slice(1)}">${user.trim()}</a>`)
}

function getContentX(permlink, author)
{
	article.permlink = permlink;
	article.author = author;
	removeChildrenRecursively(document.getElementById('query_header'));
	removeChildrenRecursively(document.getElementById('answers_list'));
	removeChildrenRecursively(document.getElementById('qq'));
	removeChildrenRecursively(document.getElementById('voters'));
	if(document.getElementById('my_vote'))
	{
		document.getElementById('my_vote').innerHTML = '';
		document.getElementById('vote_form').style = 'display: none';
	}
	
	if(document.getElementById('content_loader'))
	{
		document.getElementById('content_loader').style = 'display:block';
	}	
	
	if(document.getElementById('answers_loader'))
	{
		document.getElementById('answers_loader').style = 'display:block';
	}
	
	golos.api.getContent(author, permlink, -1, function(err, data){
		//console.log( data );
		var metadata = JSON.parse(data.json_metadata);
		console.log(metadata);
		if(document.getElementById('content_loader'))
		{
			document.getElementById('content_loader').style = 'display:none'; 
			document.getElementById('loader').style = 'display:none'; 
		}
		var result = data;
		marked.setOptions({
		  renderer: new marked.Renderer(),
		  gfm: true,
		  tables: true,
		  breaks: false,
		  pedantic: false,
		  sanitize: false,
		  smartLists: true,
		  smartypants: false
		});
		article.text = result.body;
		var main_div = document.getElementById('qq');
		/*var re = /https:\/\/golos.io/gi;
		var newbody = result.body.replace(re, 'https://golos.today');
		var re = /https:\/\/golos.blog/gi;
		var newbody = newbody.replace(re, 'https://golos.today');
		var re = /https:\/\/goldvoice.club/gi;
		var newbody = newbody.replace(re, 'https://golos.today');*/
		var newbody = marked(result.body);
	//	console.log(newbody);
		newbody = prepareContent(newbody);
		

		main_div.innerHTML = newbody;

		var date = new Date(result.created);
		var offset = date.getTimezoneOffset();
		date.setMinutes(date.getMinutes() - offset); 
		var dt = date.toLocaleDateString("ru-RU") + ' ' + date.toLocaleTimeString("ru-RU");
	  
		var vl = result.total_pending_payout_value;
		if(result.total_payout_value > result.total_pending_payout_value)
		{
			vl = result.total_payout_value;
		}
		article.payment = vl;
		article.votes = result.active_votes.length;
		article.title = result.title;
	  
		var follow = '';
		if(isLoggedIn() && document.getElementById('vote_form'))
		{
			follow = '<span class="tt" onclick="spoiler(\'follow\'); return false">больше...</span>';
			follow += '<span id="follow" class="terms" style="display: none;">';
			if(user.followers.includes(author))
			{
				follow += "<div style='float: left; margin-top: -7px; margin-right: 5px;'> <img src='images/hs.png' title='Подписан на вас'> </div>";
			}
			if(user.following.includes(author))
			{
				follow += "<button class='btn btn-warning' onClick='follow(\""+author+"\"); style.display=\"none\"'>Отписаться</button> ";
			}
			else
			{
				follow += "<button class='btn btn-success' onClick='follow(\""+author+"\"); style.display=\"none\"'>Подписаться</button> ";
			}			
			follow += "<button class='btn btn-danger' onClick='ignore(\""+author+"\"); style.display=\"none\"'>Игнорировать</button> ";
			follow += '</span>';
		}
		
		var header = document.createElement("div");
		header.innerHTML = "<h1><a href='show.html?author="+ author +"&permlink="+ permlink +"'>"+result.title+"</a><br><small>"+dt+" Автор - <a href='user.html?author="+ author +"' title='Все посты пользователя'>@"+result.author+"</a> "+ follow + "</small></h1>" + '<p class="help-text">Голосов <strong>'+result.active_votes.length+'</strong> на сумму <strong>'+vl+'</strong>  выплата '+getCommentDate(result.cashout_time)+'</p>';
		
		var ava = document.createElement("div");
		ava.style.float = 'left';
		ava.id = 'ava';
	  
		document.getElementById('query_header').appendChild(ava);	  
		document.getElementById('query_header').appendChild(header);
		if(isLoggedIn() && document.getElementById('vote_form'))
		{
			var vote_form =  document.getElementById('vote_form');
			vote_form.permlink.value = permlink;
			vote_form.author.value = author;
			vote_form.style = 'display:block'; 
		}
		  
		golos.api.getAccounts([author], function(err, response){
			if(err)
			{
				console.log(err);
			}
			
			if(response)
			{
				var ava = document.getElementById("ava");
				if(response[0].json_metadata != 'undefined' && response[0].json_metadata != '{}' && response[0].json_metadata != '')
				{
					var metadata = JSON.parse(response[0].json_metadata);
					if(metadata.profile != 'undefined')
					{
						if(metadata.profile.profile_image != undefined)
						{
							ava.style.backgroundImage = "url('https://imgp.golos.io/256x256/"+metadata.profile.profile_image+"')";
							
						}else{
							ava.style.backgroundImage = "url('images/ninja.png')";
						}
					}else{
						var ava = document.getElementById("ava");
						ava.style.backgroundImage = "url('images/ninja.png')";
					}					
				}else{
					var ava = document.getElementById("ava");

					ava.style.backgroundImage = "url('images/ninja.png')";
				}	
				ava.classList.add('ava_div');
			}
		});  
	});
	
	golos.api.getContentReplies(author, permlink, -1, function(err, data){
		if(data.length > 0)
		{
			data.forEach(function(operation){
				var main_div = addComentX(operation);
				document.getElementById('answers_list').appendChild(main_div);
				getRepliesX(operation.author, operation.permlink, main_div)
			});
		}
	});
	
	if(isLoggedIn())
	{
		document.getElementById('answer').style = 'display: block';
	}
	
	var voter = localStorage.getItem('login');
	isVoted(permlink, author, voter);
	
	golos.api.getActiveVotes(author, permlink, -1, function(err, data){
	if(data)
		if(data.length > 0)
		{
			var s = '';
			data.forEach(function(operation){
				s = s + "<a href='user.html?author="+operation.voter+"' title='"+operation.percent / 100 +"%'>@"+operation.voter+"</a> ";
			});
			document.getElementById('voters').innerHTML = '<hr><div>Оценили ('+data.length+'): <span class="tt" onclick="spoiler(\'all_votes\'); return false">показать</span> <span id="all_votes" class="terms" style="display: none;"><small>' + s + '</small></span></div>';
		}
	});	
	
}

function updateVotes(permlink, author)
{
	removeChildrenRecursively(document.getElementById('voters'));
	golos.api.getActiveVotes(author, permlink, -1, function(err, data){
		if(data)
			if(data.length > 0)
			{
				var s = '';
				data.forEach(function(operation){
					s = s + "<a href='user.html?author="+operation.voter+"' title='"+operation.percent / 100 +"%'>@"+operation.voter+"</a> ";
				});
				document.getElementById('voters').innerHTML = '<hr><div>Оценили ('+data.length+'): <span class="tt" onclick="spoiler(\'all_votes\'); return false">показать</span> <span id="all_votes" class="terms" style="display: none;"><small>' + s + '</small></span></div>';
			}
	});	
}

function follow(author)
{
	var login = localStorage.getItem('login');
	var pk = getPostingKeyByLogin(login);
	var json=JSON.stringify(['follow',{follower:login,following:author,what:['blog']}]);
	golos.broadcast.customJson(pk,[],[login],'follow',json,function(err, result){
		console.log(err);
		if(!err){
			/*$('.user-card[data-user-login="'+user_card_action.login+'"]').attr('data-subscribed','1');
			$('.user-card[data-user-login="'+user_card_action.login+'"]').attr('data-ignored','0');
			user_card_action.wait=0;
			rebuild_user_cards();*/
		}
		else{
			//user_card_action.wait=0;
			//add_notify('<strong>'+l10n.global.error_caption+'</strong> '+l10n.errors.broadcast,10000,true);
		}
	});
}

function ignore(author)
{
	var login = localStorage.getItem('login');
	var pk = getPostingKeyByLogin(login);
	var json=JSON.stringify(['follow',{follower:login,following:author,what:['ignore']}]);
	golos.broadcast.customJson(pk,[],[login],'follow',json,function(err, result){
		if(!err){
			/*$('.user-card[data-user-login="'+user_card_action.login+'"]').attr('data-subscribed','1');
			$('.user-card[data-user-login="'+user_card_action.login+'"]').attr('data-ignored','0');
			user_card_action.wait=0;
			rebuild_user_cards();*/
		}
		else{
			//user_card_action.wait=0;
			//add_notify('<strong>'+l10n.global.error_caption+'</strong> '+l10n.errors.broadcast,10000,true);
		}
	});
}

function isVoted(permlink, author, voter)
{
	if(document.getElementById('my_vote'))
	{
		document.getElementById('my_vote').innerHTML = '';
		golos.api.getActiveVotes(author, permlink, -1, function(err, data){
			if(data)
				if(data.length > 0)
				{
					data.forEach(function(operation){
						if(operation.voter == voter)
						{
							document.getElementById('my_vote').innerHTML = '<hr><div>Оценено мной <strong>'+operation.percent / 100+' %</strong></div>';
							document.getElementById('vote_form').style = 'display: none';
						}
					});
				}
		});	
	}
}

function addComentX(operation)
{
	var main_div = document.createElement("div");
	main_div.classList.add("panel");
	main_div.classList.add("panel-default");
	var header = document.createElement("div");
	header.classList.add("panel-heading");
	var actions = document.createElement("div");
	actions.style.textAlign = 'right';
	actions.style.marginBottom = '5px';
	
	var dt = getCommentDate(operation.created);
	var vl = operation.total_pending_payout_value;
	if(operation.total_payout_value > operation.total_pending_payout_value)
	{
		vl = operation.total_payout_value;
	}
	var ava = document.createElement("div");
	ava.style.float = 'left';
		
	header.innerHTML = "<div><h3>"+operation.title+" <small>"+dt+" Автор - <a href='user.html?author="+operation.author+"' title='Все посты пользователя'>@"+operation.author+"</a></small></h3>" + '<p class="help-text"> Голосов '+operation.active_votes.length+' на сумму <strong>'+vl+'</strong></p></div>'; 
	main_div.appendChild(header);
	header.appendChild(ava);
		
	var answer = document.createElement("div");
	answer.classList.add("panel-body");
	answer.innerHTML = marked(operation.body);
	if(isLoggedIn())
	{
		actions.innerHTML = '<a href="javascript:void(0);" onClick="document.getElementById(\'id_'+operation.permlink+'\').style.display = \'block\'; this.style.display = \'none\';" class="reply">Ответить</a>';
		var send = document.createElement("div");
		send.innerHTML = "<textarea id='tx_"+operation.permlink+"' style='width: 92%; height: 100px; margin: 5px;'></textarea><button onClick=\"sendComment('"+operation.permlink+"', '"+operation.author+"', 'tx_"+operation.permlink+"', this, true);\">Отправить</button>";
		send.style.display = 'none';
		send.margin = '8px';
		send.id = 'id_' + operation.permlink.trim();
		actions.appendChild(send);
	}
	main_div.appendChild(answer);
	main_div.appendChild(actions);
	if(isLoggedIn())
	{
		document.getElementById('answer').style = 'display: block';
	}
	
	golos.api.getAccounts([operation.author], function(err, response){
		//console.log(err, response);
		if(response)
		{
			if(response[0].json_metadata != undefined && response[0].json_metadata != '{}' && response[0].json_metadata != '')
			{
				var metadata = JSON.parse(response[0].json_metadata);
				console.log(metadata.profile.profile_image);
				if(metadata.profile != undefined && metadata.profile != null)
				{
					if(metadata.profile.profile_image != undefined && metadata.profile.profile_image != null)
					{
						//var ava = document.getElementById("ava");
						ava.style.backgroundImage = "url('https://imgp.golos.io/256x256/"+metadata.profile.profile_image+"')";
						ava.classList.add('ava_div');
					}else{
						ava.style.backgroundImage = "url('images/ninja.png')";
						ava.classList.add('ava_div');
					}
				}else{
					ava.style.backgroundImage = "url('images/ninja.png')";
					ava.classList.add('ava_div');
				}					
			}else{
				ava.style.backgroundImage = "url('images/ninja.png')";
				ava.classList.add('ava_div');
			}				
		}
	});
	return main_div;
}

function getRepliesX(author, permlink, parent)
{
	golos.api.getContentReplies(author, permlink, function(err, data){
		//console.log(err, data);
		if(data.length > 0)
		{
			data.forEach(function(operation){
				var div = addComentX(operation);
				div.classList.add("depth2");
				parent.appendChild(div);
				getRepliesX(operation.author, operation.permlink, div);
			});
		}
	});
}

function showEditor(id, btn)
{
	//btn.style = 'display:none';
	document.getElementById(id.trim()).style.display = 'block';
}

function getCommentDate(adate)
{
	var date = new Date(adate);
	var offset = date.getTimezoneOffset();
	date.setMinutes(date.getMinutes() - offset); 
	return moment(date, "YYYYMMDD").fromNow();
}

function sendComment(permlink, author, txt_id, button, hide)
{
	var login = localStorage.getItem('login');
	var text = document.getElementById(txt_id).value;
	var dv = document.createElement('div');
	dv.innerHTML = text;
	var text = dv.textContent || dv.innerText || "";
	var parts = explode( '-', permlink );
	var pl = '';
	for(var i = 0; i< parts.length - 1; i++)
	{
		if(i == 0)
		{
			pl += parts[i];
		}
		else{
			pl += '-' + parts[i];
		}
		
	}
	var date = new Date();
	var dt = date.getFullYear() + date.getMonth().toString() + date.getDate().toString()+ 't' + date.getHours().toString() + date.getMinutes().toString() + date.getSeconds().toString() + date.getMilliseconds().toString() + 'z';
	var new_permlink = 're-' + author + '-' + pl + '-' + dt;
	if(text && login)
	{
		var key = getPostingKey();
		if(key)
		{
			golos.broadcast.comment(key,
			author,
			permlink,
			login,
			new_permlink,
			'',
			text,
			'{"app":"golos.today","format":"text"}',
			function(err, result) {
				console.log(err);
				if(result)
				{
					document.getElementById(txt_id).value = '';
					if(hide)
					{
						document.getElementById(txt_id).style = 'display:none';
						button.style = 'display:none';
					}					
					golos.api.getContentReplies(article.author, article.permlink, function(err, data){
						if(data.length > 0)
						{
								data.forEach(function(operation){
									var main_div = addComentX(operation);
									document.getElementById('answers_list').appendChild(main_div);
									getRepliesX(operation.author, operation.permlink, main_div)
								});
							}
						});
				}
				if(err)
				{
					console.log( err.payload.error.message);
					//if(err.i.payload.data.code == 10)
					{
						alert('Ошибка при публикации. ' + err.payload.error.message);
					}
				}				
			});			 
		}		
	}
}

function sendMainComment(button)
{
	sendComment(article.permlink, article.author, 'editor', button, false); 
}

function loadUserCard(login)
{
	golos.api.getAccounts([login], function(err, response){
		//console.log(err, response);
		if(response)
		{
			var ava_base = document.getElementById("avatar");
			var hello = document.getElementById("hello");
			var ava = document.createElement("div");
			if(response[0].json_metadata != 'undefined' && response[0].json_metadata != '{}' && response[0].json_metadata != '')
			{
				var metadata = JSON.parse(response[0].json_metadata);
				if(metadata.profile != 'undefined')
				{
					if(metadata.profile.profile_image != 'undefined')
					{
						ava.style.backgroundImage = "url('https://imgp.golos.io/256x256/"+metadata.profile.profile_image+"')";
						
					}else{
						ava.style.backgroundImage = "url('images/logo.png')";
					}
				}else{
					var ava = document.getElementById("ava");
					ava.style.backgroundImage = "url('images/logo.png')";
				}					
			}else{
				var ava = document.getElementById("ava");

				ava.style.backgroundImage = "url('images/logo.png')";
			}	
			ava.classList.add('ava_div');
			//ava.style.display = 'block';
			ava_base.appendChild(ava);
			//document.getElementById("login_div").style.display = 'none';
		}
	}); 
}

function Init()
{
	if(!isLoggedIn())
	{
		jQuery('#login_div').show();
		jQuery('#feed').hide();
		jQuery('#blog').hide();
		jQuery('#post').hide();
		jQuery('#answer').hide();
		jQuery('#exit').hide();
		jQuery('#options').hide();
	}	
	else
	{
		user.login = localStorage.getItem('login');
		jQuery('#login_div').hide();
		jQuery('#hello').html('Привет, @' + user.login);
		getUserPower(user.login);
		
		//check options
		if(localStorage.getItem('open') == 'true')
		{
			jQuery('#x7').hide();
			document.getElementById('x5').classList.remove('col-lg-5');
			document.getElementById('x5').classList.add('col-lg-12');
		}
	}
	//jQuery('#items_list_wrapper').height = window.heigh - 120;	
	//document.getElementById("items_list_wrapper").style.maxHeight = jQuery(window).height() - 120;
	//document.getElementById("items_list_wrapper").height = jQuery(window).height() - 120;
	//console.log(document.getElementById("items_list_wrapper"));
}

function checkLogin(login)
{
	golos.api.getAccounts([login], function(err, response){
		if(response == '')
		{
			document.getElementById('login').value = '';
			return false;
		}
		return true;
	});

}

function storeKeyLocally()
{
	var login = document.getElementById("login").value;
	var key = document.getElementById("key").value;
	if(key && login)
	{
		localStorage.setItem(login, sjcl.encrypt(login, key));
		localStorage.setItem('login', login);
		return true;
	}		
	else
	{
		return false;
	}
}

function getUserPower(login)
{
	golos.api.getAccounts([login], function(err, response){
		if(response)
		{
			var bt = response[0].voting_power /100;
			jQuery('#battery').html( 'твой заряд: ' + bt + '%');
		}				
	});  	 
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function unique(arr) {
  var obj = {};

  for (var i = 0; i < arr.length; i++) {
    var str = arr[i];
    obj[str] = true; // запомнить строку в виде свойства объекта
  }

  return Object.keys(obj); // или собрать ключи перебором для IE8-
}

function isKyr(str) {
    return /[а-яё]/i.test(str);
}

function postBlog(title, tags)
{
	var image = jQuery('#image').val();
	var key = getPostingKey();
	if(!key)
	{
		alert('Не получается найти ваш ключ. Авторизуйтесь еще раз.');
		return;
	}
	if(!user.login)
	{
		alert('Не пойму кто передо мной. Авторизуйтесь еще раз.');
		return;
	}
	if(!title)
	{
		alert('Для публикации нужен заголовок поста.');
		return;
	}
	if(!tags)
	{
		alert('Укажите хотя бы один тэг.');
		return;
	}
	if(!editor.getMarkdown())
	{
		alert('Нужен какой-то текст.');
		return;
	}
	
	var t = tags.split(' ');
	var t2 = [];
	t.forEach(function(item){
		if(isKyr(item))
		{
			t2.push('ru--' + detransliterate(item, 1).toLowerCase().trim());
		}
		else
		{
			t2.push(item.toLowerCase().trim());
		}
		
	});
	t2 = unique(t2);
	tags = t2.join('","');
	var new_permlink = title;
	new_permlink = new_permlink.replace(/\s+/g,"-");	
	
	var img = '';
	
	if(image)
	{
		img = ', "image": ["'+image+'"]';
	}
	
	var uniq = Math.round(new Date().getTime() / 1000);
	new_permlink = detransliterate(new_permlink, 1).toLowerCase() + '-' + uniq;
	new_permlink = new_permlink.replace(/[^a-z0-9 -]/g, "").trim();
	console.log(new_permlink, tags, user.login, title, editor.getMarkdown().trim());
	golos.broadcast.comment(key,
			'',
			'golostoday',
			user.login,
			new_permlink,
			title.trim(),
			editor.getMarkdown().trim(),
			'{"tags":["'+tags+'"], "app": "golos.today", "format": "markdown"'+img+'}',
			function(err, result) {
				if(err)
				{
					console.log(err);
					alert('Произошла ошибка при публикации. ' + err.payload.error.message);
					return;
				}
				if(result)
				{
					alert('Вы успешно опубликовали пост.');
				}
	
			});	
}

function loadOptions()
{
	if(localStorage.getItem('open') == 'true')
	{
		document.getElementById('open').checked = true;
	}
	else
	{
		document.getElementById('open').checked = false;
	}
	if(localStorage.getItem('node'))
	{
		document.getElementById('node').value = localStorage.getItem('node');
	}
}

function saveOptions()
{
	if(document.getElementById('open').checked)
	{
		localStorage.setItem('open', true);
	}
	else
	{
		localStorage.setItem('open', false);
	}
	if(document.getElementById('node').value != '')
	{
		localStorage.setItem('node', document.getElementById('node').value);
	}
	else
	{
		localStorage.setItem('node', 'wss://ws.golos.io/');
	}
	alert('Настройки сохранены');
}