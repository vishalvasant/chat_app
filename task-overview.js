var task_room = 'task:' + task_id;

function socket_connect_event() {
	socket_room_join( task_room );
}

var task_overview_load_func = function () {
	/* checkin checkout */
	var task_checkout_users = function ( user_ids, callback ) {
		$.ajax( {
			url: window.Laravel.adminUrl + '/tasks/timelog_checkout/post',
			data: {
				_token: window.Laravel.csrfToken,
				task_id: task_id,
				user_ids: user_ids,
			},
			type: 'post',
			success: function ( res ) {
				console.log( res );
				callback( res );
			},
			error: function ( res ) {
				console.log( 'timelog_checkout error: ', res );
			},
		} );
	};

	var $checkin_btn = $( '.task-checkin-btn' );
	var $checkout_btn = $( '.task-checkout-btn' );
	$checkin_btn.click( function ( e ) {
		$checkin_btn.addClass( 'hide' );
		$.ajax( {
			url: window.Laravel.adminUrl + '/tasks/timelog_checkin/post',
			data: {
				_token: window.Laravel.csrfToken,
				task_id: task_id,
			},
			type: 'post',
			success: function ( res ) {
				//console.log(res);
				//$checkout_btn.attr('data-timelog-id', res.timelog_id);
				$checkout_btn.removeClass( 'hide' );
			},
			error: function ( res ) {
				console.log( 'timelog_checkin error: ', res );
			},
		} );
		e.preventDefault();
		return false;
	} );
	$checkout_btn.click( function ( e ) {
		$checkout_btn.addClass( 'hide' );
		task_checkout_users( [ window.Laravel.authAdminId ], function () {
			//$checkin_btn.removeClass('hide');
		} );
		e.preventDefault();
		return false;
	} );

	var $task_checkout_multi_drop = $( '.task-checkout-multi-drop' );
	var $task_checkout_multi_btn = $( '.task-checkout-multi-btn' );
	$( document ).on( 'click', '.task-checkout-multi-drop', function ( e ) {
		e.stopPropagation();
	} );
	$task_checkout_multi_btn.click( function ( e ) {
		var $checked = $task_checkout_multi_drop.find( 'input:checkbox[data-user_id]:checked' );
		if ( $checked.length == 0 ) {
			alert_push( 'error', 'Please select a user to checkout.' );
			e.preventDefault();
			return false;
		}
		$( '#page-loader-wrap' ).fadeIn( 500 );
		var user_ids = [ ];
		$checked.each( function () {
			user_ids.push( this.getAttribute( 'data-user_id' ) );
		} );
		task_checkout_users( user_ids, function () {
			$checked.each( function () {
				$( this ).closest( 'li' ).remove();
			} );
			if ( $task_checkout_multi_drop.find( '.dropdown-menu > li' ).length == 1 ) {
				$task_checkout_multi_drop.remove();
			}
			$( '#page-loader-wrap' ).fadeOut( 500 );
		} );
		e.preventDefault();
		return false;
	} );
	/* end checkin checkout */

	$( '[name="task_status"]' ).each( function () {
		var $this = $( this );
		$this.attr( 'data-value', $this.val() );

		if( dept_assigned != 'firm' && dept_assigned != 'client' ) {

			$this.find('option').each(function () {
				$this_option = $(this);
				if( $this_option.val() == 'recurring' || $this_option.val() == 'assigned' || $this_option.val() == 'not_started' || $this_option.val() == 'completed' ) {
					$this_option.hide();
				}

				if(is_admin_staff) {
					if($this_option.val() == 'docs_submitted' || $this_option.val() == 'open') {
						$this_option.hide();
					}
				}

				if(is_firm) {
					if($this_option.val() == 'under_review' || $this_option.val() == 'missing_docs' || $this_option.val() == 'reassign') {
						$this_option.hide();
					}
				}

				if(is_admin || is_firm) {
					if($this_option.val() == 'cancelled') {
						$this_option.show();
					}
					if( $this.val()=="billed" ) {
						if(is_admin) {
							if($this_option.val() == 'reassign') {
								$this_option.show();
							}
						} else {
							if($this_option.val() == 'reassign') {
								$this_option.hide();
							}
						}
					} else {
						if( $this_option.val() == 'reassign') {
							$this_option.show();
						}
					}
				} else {
					if($this_option.val() == 'cancelled' || $this_option.val() == 'reassign') {
						$this_option.hide();
					}
				}
			});

			if($this.val()=="not_started"){
				$this.closest("tr").find(".row_edit_li").show();
			}else{
				$this.closest("tr").find(".row_edit_li").hide();
			}

			if($this.val()=='in_progress') {
				$this.find('option').each(function () {
					$this_option = $(this);
					if( $this_option.val() == 'cancelled' ) {
						$this_option.hide();
					}
				});
			}

			if($this.val()=='completed') {
					$this.find('option').each(function () {
						$this_option = $(this);
						if( $this_option.val() == 'closed' ) {
							if(is_admin || is_firm) {
								$this_option.show();
							} else {
								$this_option.hide();
							}
						} else {
							$this_option.hide();
						}
					});
			} else {
				$this.find('option').each(function () {
					$this_option = $(this);
					if( $this_option.val() == 'closed' || $this_option.val() == 'billed' ) {
						$this_option.hide();
					}
				});
			}

			if($this.val() == 'closed') {
				$this.find('option').each(function () {
					$this_option = $(this);
					if( $this_option.val() == 'open' || $this_option.val() == 'billed' ) {
						if(is_admin) {
							$this_option.show();
						} else if(is_firm) {
							if( $this_option.val() == 'reassign' ) {
								$this_option.show();
							} else {
								$this_option.hide();
							}
						}
					} else {
						$this_option.hide();
					}
				});
			}

			if($this.val() == 'billed') {
				$this.find('option').each(function () {
					$this_option = $(this);
					$this_option.hide();
				});
			}
		} else if( dept_assigned == 'firm') {
			is_user_assigned =  (user_assigned == current_user) ? true : false;
			$this.find('option').each(function () {
				$this_option = $(this);
				if( $this_option.val() == 'closed' ) {
					if(is_admin || is_user_assigned) {
						$this_option.show();
					} else {
						$this_option.hide();
					}
				}
			});
		}

		$this.change( function () {
			swal( {
				title: "Are you sure to update status?",
				//text: "Your will not be able to recover this imaginary file!",
				//type: "warning",
				showCancelButton: true,
				confirmButtonClass: "btn-primary",
				confirmButtonText: "Yes. Do it!",
				closeOnConfirm: false,
				closeOnCancel: false,
			}, function ( is_confirm ) {
				if ( is_confirm ) {
					$.ajax( {
						url: window.Laravel.adminUrl + '/tasks/update_task_status/post',
						data: {
							_token: window.Laravel.csrfToken,
							task_id: task_id,
							status: $this.val(),
						},
						type: 'post',
						success: function ( data ) {
							if( dept_assigned != 'firm' && dept_assigned != 'client' ) {

								if(data.name == 'closed' || data.name == 'reassign' || data.name == 'open') {
									$.ajax( {
										url: window.Laravel.adminUrl + '/tasks/update_output_email_status/post',
										data: {
											_token: window.Laravel.csrfToken,
											task_id: task_id,
											status: $this.val(),
										},
										type: 'post',
										success: function ( res ) {
											window.location.reload(true);
										}
									});
								}
								$this.find('option').each(function () {
									$this_option = $(this);
									if( $this_option.val() == 'recurring' || $this_option.val() == 'assigned' || $this_option.val() == 'not_started' || $this_option.val() == 'completed' ) {
										$this_option.hide();
									}

									if(is_admin || is_firm) {
										if($this_option.val() == 'cancelled') {
											$this_option.show();
										}
										if( $this.val()=="billed" ) {
											if(is_admin) {
												if($this_option.val() == 'reassign') {
													$this_option.show();
												}
											} else {
												if($this_option.val() == 'reassign') {
													$this_option.hide();
												}
											}
										} else {
											if( $this_option.val() == 'reassign') {
												$this_option.show();
											}
										}
									} else {
										if($this_option.val() == 'cancelled' || $this_option.val() == 'reassign') {
											$this_option.hide();
										}
									}
								});

								if($this.val()=="not_started"){
									$this.closest("tr").find(".row_edit_li").show();
								}else{
									$this.closest("tr").find(".row_edit_li").hide();
								}

								if($this.val()=='in_progress') {
									$this.find('option').each(function () {
										$this_option = $(this);
										if( $this_option.val() == 'cancelled' ) {
											$this_option.hide();
										}
									});
								}

								if($this.val()=='completed') {
										$this.find('option').each(function () {
											$this_option = $(this);
											if( $this_option.val() == 'closed' ) {
												if(is_admin || is_firm) {
													$this_option.show();
												} else {
													$this_option.hide();
												}
											} else {
												$this_option.hide();
											}
										});
								} else {
									$this.find('option').each(function () {
										$this_option = $(this);
										if( $this_option.val() == 'closed' || $this_option.val() == 'billed' ) {
											$this_option.hide();
										}
									});
								}

								if($this.val() == 'closed') {
									$this.find('option').each(function () {
										$this_option = $(this);
										if( $this_option.val() == 'open' || $this_option.val() == 'billed' ) {
											if(is_admin) {
												$this_option.show();
											} else if(is_firm) {
												if( $this_option.val() == 'reassign' ) {
													$this_option.show();
												} else {
													$this_option.hide();
												}
											}
										} else {
											$this_option.hide();
										}
									});
								}

								if($this.val() == 'billed') {
									$this.find('option').each(function () {
										$this_option = $(this);
										$this_option.hide();
									});
								}
							}
						},
						error: function ( res ) {
							console.log( 'update_task_status error:', res );
						},
					} )
					$this.attr( 'data-value', $this.val() );
				} else {
					$this.val( $this.attr( 'data-value' ) );
				}
				swal.close();
			} );
		} );
	} );

	var task_new_msg_txt = CKEDITOR.replace( 'task_new_msg_txt', {
		customConfig: window.Laravel.siteUrl + '/js/ckeditor-task-messages.js',
	} );

	/* $('#task-overview-scroll').slimScroll({
	 height: $('#task-overview-scroll').height()
	 });
	 
	 $('#task-messages-scroll').slimScroll({
	 height: $('#task-messages-scroll').height()
	 }); */

	socket_room_join( task_room );

	socket_room_receive_message( task_room, function ( data ) {
		append_task_message( data );
	} );

	$.ajax( {
		url: window.Laravel.adminUrl + '/tasks/get_messages/post',
		data: {
			_token: window.Laravel.csrfToken,
			task_id: task_id,
		},
		type: 'post',
		success: function ( res ) {
			//console.log(res);
			var count_messages = res.messages.length;
			$.each( res.messages, function ( i, data ) {
				append_task_message( data, count_messages === i + 1 );
			} );
			var $first_unread = $( '.task-msg-item[data-is_unreaded="y"]:eq(0)' );
			if ( $first_unread.length > 0 ) {
				scroll_to_task_message( $first_unread.attr( 'data-id' ) );
			}
		},
		error: function ( res ) {
			console.log( "get task messages error: ", res );
		},
	} );

	$( '.send-message-button' ).click( function () {
		var $this = $( this );
		var message = task_new_msg_txt.getData().trim();
		if ( message !== '' ) {
			var is_todo = '';
			var todo_due_date = '';
			if ( $( "#is_task_todo" ).is( ':checked' ) ) {
				is_todo = 'y';
				todo_due_date = $( "#task_todo_due_date" ).val().trim();
				if ( todo_due_date == '' ) {
					alert_push( 'error', 'Please select todo due date' );
					return;
				}
			}
			$this.prop( 'disabled', true );

			var $message_html = $( message );
			var mention_list = [ ];
			$message_html.find( '[data-mention-id]' ).each( function () {
				mention_list.push( parseInt( $( this ).attr( 'data-mention-id' ) ) );
			} );
			//console.log(mention_list);
			var reply_to = $( '.replying_to_cont' ).attr( 'data-id' );
			if ( is_empty( reply_to ) ) {
				reply_to = '0';
			}

			$.ajax( {
				url: window.Laravel.adminUrl + '/tasks/send_message/post',
				data: {
					_token: window.Laravel.csrfToken,
					message: message,
					mention_list: mention_list,
					task_id: task_id,
					is_todo: is_todo,
					todo_due_date: todo_due_date,
					reply_to: reply_to,
				},
				type: 'post',
				dataType: 'json',
				success: function ( data ) {
					task_new_msg_txt.setData( '' );
					$( "#is_task_todo" ).prop( 'checked', false ).trigger( 'change' );
					$( "#cke_task_new_msg_txt" ).find( '.replying_to_cont' ).remove();
					socket_room_send_message( task_room, data );
				},
				error: function ( res ) {
					console.log( 'Send message error: ', res );
				},
				complete: function ( ) {
					$this.prop( 'disabled', false );
				}
			} );
		} else {
			alert_push( 'error', 'Please enter message' );
		}
	} );

	$( '#task_new_file_input' ).change( function () {
		var $this = $( this );

		var bar = $('.bar');
    	var percent = $('.percent');

		var form_data = new FormData();
		form_data.append( '_token', window.Laravel.csrfToken );
		form_data.append( 'task_id', task_id );
		for ( i = 0; i < this.files.length; i++ ) {
			form_data.append( 'files[' + i + ']', this.files[i] );
		}

		// $( '#page-loader-wrap' ).fadeIn( 500 );
		$.ajax( {
			url: window.Laravel.adminUrl + '/tasks/send_message_files/post',
			data: form_data,
			type: 'post',
			dataType: 'json',
			cache: false,
			contentType: false,
			processData: false,
			beforeSend: function() {
	            var percentVal = '0%';
	            bar.width(percentVal);
	            percent.html(percentVal);
	        },
			success: function ( data ) {
				socket_room_send_message( task_room, data );
			},
			error: function ( res ) {
				console.log( 'upload file error: ', res );
			},
			xhr: function(){
		       var xhr = new window.XMLHttpRequest();
		         // Handle progress
		         //Upload progress
		       xhr.upload.addEventListener("progress", function(evt){
		           if (evt.lengthComputable) {
		              	var percentComplete = (evt.loaded / evt.total) * 100;
		              	//Do something with upload progress
		              	var percentVal = parseInt(percentComplete) + '%';
	            		bar.width(percentVal);
	            		percent.html(percentVal);
		           }
		       }, false);

		       return xhr;
		    },
			complete: function (res) {
				// $( '#page-loader-wrap' ).fadeOut( 500 );
				$this.val( '' );
			}
		} );
	} );

	$( ".is_completed" ).change( function () {
		var $this = $( this );
		var val = "p";
		if ( $this.is( ":checked" ) ) {
			val = "c";
			if($('[name="task_status"]').attr('data-value') == 'recurring' || $('[name="task_status"]').attr('data-value') == 'assigned' || $('[name="task_status"]').attr('data-value') == 'not_started'){
				$('[name="task_status"]').val('in_progress').trigger('change');
			}

			if($('.task-status').find('.badge').attr('data-task-status') == 'not_started') {
				$.ajax( {
					url: window.Laravel.adminUrl + '/tasks/update_task_status/post',
					data: {
						_token: window.Laravel.csrfToken,
						task_id: task_id,
						status: 'in_progress',
					},
					type: 'post',
					success: function ( data ) {
						$('.task-status').find('.badge').attr('data-task-status', 'in_progress');
						$('.task-status').find('.badge').text('In Progress');
					},
					error: function ( res ) {
						console.log( 'update_task_status error:', res );
					},
				} );
			}

		}
		var step_id = $this.attr( "data-step_id" );
		var $parent = $this.closest( ".task-overview-item" );
		$this.prop( "disabled", true );
		$.ajax( {
			url: window.Laravel.adminUrl + '/tasks/update_step_status/post',
			data: { "step_id": step_id, "val": val, "_token": window.Laravel.csrfToken },
			type: "post",
			success: function ( res ) {
				if ( res.status == "Completed" ) {
					$parent.find( ".step_status" ).html( res.status );
					$parent.find( ".user_image" ).html( res.user_image );
					$parent.find( ".user_image" ).attr( "data-original-title", res.user_name );
					$this.closest( ".task-overview-item" ).addClass( "completed" );
				} else {
					$parent.find( ".step_status" ).html( res.status );
					$parent.find( ".user_image" ).html( res.user_image );
					$parent.find( ".user_image" ).attr( "data-original-title", res.user_name );
					$this.closest( ".task-overview-item" ).removeClass( "completed" );
				}
				calculate_task_progress_show();
			}, complete: function () {
				$this.prop( "disabled", false );
			}
		} );
	} );

	calculate_task_progress_show();

	$( "#is_task_todo" ).change( function () {
		var $this = $( this );
		if ( $this.is( ":checked" ) ) {
			$( "#task_todo_due_date" ).removeClass( 'hide' );
		} else {
			$( "#task_todo_due_date" ).addClass( 'hide' );
		}
	} ).prop( 'checked', false );

	/* resize div logic */
	if ( !window.jquery_ui_add_resizable_reverse_added ) {
		window.jquery_ui_add_resizable_reverse_added = true;
		jquery_ui_add_resizable_reverse();
	}
	var $task_overview_resize = $( "#task-overview-resize" );
	var $task_messages_resize = $( "#task-messages-resize" );
	var parent_width = $task_overview_resize.closest( '.task-overview-col' ).width();
	if ( parent_width > 700 ) {
		var parent_width_min = Math.floor( parent_width * 25 / 100 );
		var parent_width_max = Math.floor( parent_width * 75 / 100 );
		$task_overview_resize.css( {
			'min-width': parent_width_min + 'px',
			'max-width': parent_width_max + 'px',
		} );
		$task_messages_resize.css( {
			'min-width': parent_width_min + 'px',
			'max-width': parent_width_max + 'px',
		} );
		$task_overview_resize.resizable( {
			alsoResizeReverse: '#' + $task_messages_resize.attr( 'id' ),
			handles: 'e',
			start: function () {
				$( '.overlay-show-on-drag-start' ).show();
			},
			stop: function () {
				$( '.overlay-show-on-drag-start' ).hide();
			}
		} );
	}
	/* end resize div logic */
}

$('#myRange').mousemove(function(){
	var $progress = $( "#single-task-progress" );
	var progress = $('#myRange').val();
	$progress.find( '.progress-bar' ).width( progress + '%' );
	$progress.find( '.progress-status' ).text( progress + '% Completed' );
});

$('#myRange').mouseleave(function(){
	var progress = $('#myRange').val();
	$.ajax( {
		url: window.Laravel.adminUrl + '/tasks/update_progress_status/post',
		data: { "task_id": task_id, "val": progress, "_token": window.Laravel.csrfToken },
		type: "post",
		success: function ( res ) {
			console.log(res);
		}
	} );
});

function calculate_task_progress_show() {
	var total_todo = $( ".is_completed" ).length;
	var completed_todo = $( ".is_completed:checked" ).length;
	var progress = 0;
	var $progress = $( "#single-task-progress" );
	if ( total_todo > 0 ) {
		progress = Math.ceil( completed_todo * 100 / total_todo );
		$progress.find( '.progress-bar' ).width( progress + '%' );
		$progress.find( '.progress-status' ).text( progress + '% Completed' );
		$.ajax( {
			url: window.Laravel.adminUrl + '/tasks/update_progress_status/post',
			data: { "task_id": task_id, "val": progress, "_token": window.Laravel.csrfToken },
			type: "post",
			success: function ( res ) {
				console.log(res);
			}
		} );
	} else {
		$.ajax( {
			url: window.Laravel.adminUrl + '/tasks/update_progress_status/post',
			data: { "task_id": task_id, "_token": window.Laravel.csrfToken },
			type: "post",
			success: function ( res ) {
				if(res.progress.progress == null) {
					res.progress.progress = 0;
				}
				$progress.find( '.progress-bar' ).width( res.progress.progress + '%' );
				$progress.find( '#myRange' ).val( res.progress.progress );
				$progress.find( '.progress-status' ).text( res.progress.progress + '% Completed' );
			}
		} );
	}
}

function scroll_to_task_message( msg_id ) {
	var $task_messages_scroll = $( '#task-messages-scroll' );
	var item_offset_top = $( '.task-msg-item[data-id="' + msg_id + '"]' ).offset().top;
	var cont_offset_top = $task_messages_scroll.offset().top;
	var cont_scroll_top = $task_messages_scroll.prop( 'scrollTop' );
	$task_messages_scroll.animate( {
		scrollTop: cont_scroll_top + item_offset_top - cont_offset_top - 10,
	}, 500 );
}

function append_task_message( data, should_update_time ) {

	should_update_time = ( ( typeof should_update_time !== 'undefined' ) ? should_update_time : true );

	data.mention_list = is_empty( data.mention_list ) ? [ ] : JSON.parse( data.mention_list );

	var $task_messages_cont = $( '#task-messages-cont' );

	var $tpl = $( $( '#messages_tpl' ).html() );
	$tpl.attr( 'data-id', data.id )
	$tpl.attr( 'data-is_unreaded', data.is_unreaded || 'n' )
	if(is_empty(data.sender_image)){
		$tpl.find( '.user_image' ).attr('src', '').hide();
		$tpl.find( '.user-avatar-nm' ).html( data.sender_first_name.substr( 0, 1 ).toUpperCase() + data.sender_last_name.substr( 0, 1 ).toUpperCase() );
	} else {
		$tpl.find( '.user_image' ).attr( 'src', data.sender_image );
		$tpl.find( '.user-avatar-nm' ).html('').hide();
	}
	$tpl.find( '.username' ).html( data.sender_first_name + ' ' + data.sender_last_name );
	$tpl.find( '.email' ).html( data.email );
	$tpl.find( '.message' ).html( data.message );
	$tpl.find( '.created_date' ).attr( "data-diff-from-now-utc", data.created_at );

	var $task_msg_quate_wrap = $tpl.find( '.task-msg-quate-wrap' );
	if ( data.reply_to == '0' || is_empty( data.rtm_first_name ) ) {
		$task_msg_quate_wrap.remove();
	} else {
		$task_msg_quate_wrap.find( '.task-msg-quate-user' ).text( data.rtm_first_name + ' ' + data.rtm_last_name );
		$task_msg_quate_wrap.find( '.task-msg-quate' ).text( $( '<div>' + data.rtm_message + '</div>' ).text() );
		$task_msg_quate_wrap.children( 'a' ).click( function ( e ) {
			scroll_to_task_message( data.reply_to );
			e.preventDefault();
			return false;
		} );
	}

	var $todo_box = $tpl.find( '.task-msg-todo-box' );
	if ( data.is_todo == 'y' ) {
		var $checkbox = $todo_box.find( '[type=checkbox]' );
		if ( !is_empty( data.todo_completed_at ) ) {
			$todo_box.addClass( 'completed' );
			$checkbox.prop( 'checked', true );
		}
		$checkbox.change( function () {
			$todo_box.removeClass( 'completed' );
			var is_completed = $checkbox.is( ':checked' ) ? 'yes' : 'no';
			var message = '<p>Marking ToDo as not completed.</p>';
			if ( is_completed == 'yes' ) {
				$todo_box.addClass( 'completed' );
				message = '<p>Marking ToDo as completed.</p>';
			}
			$.ajax( {
				url: window.Laravel.adminUrl + '/tasks/update_message_doto_status/post',
				data: {
					_token: window.Laravel.csrfToken,
					task_msg_id: data.id,
					is_completed: is_completed,
				},
				type: "post",
				success: function ( res ) {
					count_pending_message_todos();
				}, error: function ( res ) {
					console.log( 'update_message_doto_status error:', res );
				}
			} );
			/* send message */
			$.ajax( {
				url: window.Laravel.adminUrl + '/tasks/send_message/post',
				data: {
					_token: window.Laravel.csrfToken,
					message: message,
					task_id: task_id,
					reply_to: data.id,
				},
				type: 'post',
				success: function ( data ) {
					socket_room_send_message( task_room, data );
				},
				error: function ( res ) {
					console.log( 'Send message error: ', res );
				},
			} );

		} );
		$todo_box.find( '.task-msg-todo' ).html( "To-Do: " + moment( data.todo_due_date ).format( 'MM/DD/YYYY' ) );
	} else {
		$todo_box.remove();
	}
	$tpl.find( '.btn-reply' ).click( function ( e ) {
		reply_to_message( data );
		e.preventDefault();
		return false;
	} );
	$task_messages_cont.append( $tpl );
	if ( should_update_time ) {
		update_diff_from_now();
		count_pending_message_todos();
		bind_error_image();
	}
}

function count_pending_message_todos() {
	var counter = $( '.task-msg-todo-box' ).find( 'input[type=checkbox]:not(:checked)' ).length;
	$( '[data-pending-message-todo]' )
			.attr( 'data-pending-message-todo', counter )
			.html( counter + ' pending todo(s)' );
}

function reply_to_message( data ) {
	//console.log( data );
	var $cke_task_new_msg_txt = $( "#cke_task_new_msg_txt" );
	var $replying_to_cont = $cke_task_new_msg_txt.find( '.replying_to_cont' );
	$replying_to_cont.remove();
	var replying_to_html = '<div class="replying_to_cont" data-id="' + data.id + '">'
			+ '<a class="pull-right reply_to_remove" href="#" ><i class="fa fa-times"></i></a>'
			+ '<div class="reply_to_user">' + data.sender_first_name + ' ' + data.sender_last_name + '</div>'
			+ '<div class="reply_to_message">' + $( '<div>' + data.message + '</div>' ).text() + '</div>'
			+ '</div>';
	var $replying_to_cont = $( replying_to_html );
	$replying_to_cont.find( '.reply_to_remove' ).click( function ( e ) {
		$replying_to_cont.remove();
		e.preventDefault();
		return false;
	} );
	$cke_task_new_msg_txt.find( '.cke_top' ).after( $replying_to_cont );
	var $task_messages_scroll = $( '#task-messages-scroll' );
	$task_messages_scroll.animate( {
		scrollTop: $task_messages_scroll.prop( "scrollHeight" )
	}, 500 );
}

function jquery_ui_add_resizable_reverse() {
	$.ui.plugin.add( "resizable", "alsoResizeReverse", {
		start: function () {
			var that = $( this ).resizable( "instance" ),
					o = that.options,
					_store = function ( exp ) {
						$( exp ).each( function () {
							var el = $( this );
							el.data( "ui-resizable-alsoResizeReverse", {
								width: parseInt( el.width(), 10 ) + 30,
								height: parseInt( el.height(), 10 ),
								left: parseInt( el.css( "left" ), 10 ),
								top: parseInt( el.css( "top" ), 10 )
							} );
						} );
					};
			if ( typeof ( o.alsoResizeReverse ) === "object" && !o.alsoResizeReverse.parentNode ) {
				if ( o.alsoResizeReverse.length ) {
					o.alsoResizeReverse = o.alsoResizeReverse[0];
					_store( o.alsoResizeReverse );
				} else {
					$.each( o.alsoResizeReverse, function ( exp ) {
						_store( exp );
					} );
				}
			} else {
				_store( o.alsoResizeReverse );
			}
		},
		resize: function ( event, ui ) {
			var that = $( this ).resizable( "instance" ),
					o = that.options,
					os = that.originalSize,
					op = that.originalPosition,
					delta = {
						height: ( that.size.height - os.height ) || 0,
						width: ( that.size.width - os.width ) || 0,
						top: ( that.position.top - op.top ) || 0,
						left: ( that.position.left - op.left ) || 0
					},
			_alsoResizeReverse = function ( exp, c ) {
				$( exp ).each( function () {
					var el = $( this ),
							start = $( this ).data( "ui-resizable-alsoResizeReverse" ),
							style = { },
							css = c && c.length ?
							c :
							el.parents( ui.originalElement[0] ).length ? [ "width", "height" ] : [ "width", "height", "top", "left" ];
					$.each( css, function ( i, prop ) {
						var sum = ( start[prop] || 0 ) - ( delta[prop] || 0 );
						if ( sum && sum >= 0 ) {
							style[prop] = sum || null;
						}
					} );
					el.css( style );
				} );
			};
			if ( typeof ( o.alsoResizeReverse ) === "object" && !o.alsoResizeReverse.nodeType ) {
				$.each( o.alsoResizeReverse, function ( exp, c ) {
					_alsoResizeReverse( exp, c );
				} );
			} else {
				_alsoResizeReverse( o.alsoResizeReverse );
			}
		},
		stop: function () {
			$( this ).removeData( "resizable-alsoResizeReverse" );
		}
	} );
}