$(document).ready(on_ready);

var db = localStorage;

function decode(str) {
    return eval('('+str+')');
}

function on_ready() {
    if (!db.account) {
        db.account = prompt("Account ID");
        location.reload();
    } else {
        account.get();
    }
}

var clusterNode = null;
var clusterStyle = null;
var clusterSelect = null;
var clusterData = null;

var util = {
    count_keys:function(o) {
        var i=0;
        for (var key in o) i++;
        return i;
    },
    tag:function(name,kv) {
        var html = ["<",name];
        for (var key in kv) {
            html.push(" ");
            html.push(key);
            html.push("='");
            html.push(kv[key]);
            html.push("'");
        }
        html.push(">");
        return html.join('');
    }
};

var account = {
    reset:function() {
        db.account = '';
        location.reload();
    },

    get:function() {
        cluster.render(null);
        $.ajax({
            url:"/api/get_account",
            data:{id:db.account},
            success:function(data,status,xhr) {
                account.render(decode(data));
            },
            error:function(xhr,status,error) {
                db.account='';
                location.reload();
            }
        });
    },
    render:function(account) {
        var html = ["<ul id='account'>"];
        var clusters = account.clusters;
        for (var i=0; i<clusters.length; i++) {
            html.push('<li>');
            html.push('<a id="');
            html.push(clusters[i]);
            html.push('" onclick=\'cluster.select(this)\'>');
            html.push(clusters[i]);
            html.push('</a>');
            html.push('</li>');
        }
        html.push("</ul>");
        $('#clusters').html(html.join(''));
        if (clusterSelect) {
            cluster.select($('#'+clusterSelect)[0]);
            clusterSelect = null;
        }
    }
};

var cluster = {
    select:function(node) {
        if (node != null && node != clusterNode) {
            if (clusterNode != null) clusterNode.style['background-color'] = clusterStyle;
            clusterNode = node;
            clusterStyle = node.style['background-color'];
            node.style['background-color'] = '#ddd';
        }
        $.ajax({
            url:"/api/get_cluster",
            data:{id:node.text},
            success:function(data,status,xhr) {
                cluster.render(decode(data));
            },
            error:function(xhr,status,error) {
                alert("Failure Retrieving Cluster Info: "+error);
            }
        });
    },

    render:function(cluster) {
        if (!cluster) {
            $('#cluster').hide();
            return;
        }
        clusterData = cluster;
        $('#cluster').show();
        $('#cluster-about').html(clusterData.about || clusterNode.id);
        var html = [];
        for (var key in cluster.require) {
            html.push(util.tag("button",{onclick:"cluster.setRequired(\""+key+"\")"}));
            html.push(key+":"+cluster.require[key]+"</button>");
        }
        $("#cluster-required").html(html.join(''));
        var html = [];
        for (var key in cluster.proc) {
            if (cluster.proc[key] == 0) continue;
            html.push(util.tag("button",{onclick:"cluster.showRegistered(\""+key+"\")"}));
            html.push(key+":"+util.count_keys(cluster.proc[key])+"</button>");
        }
        $("#cluster-registered").html(html.join(''));
        var html = [];
        for (var key in cluster.node) {
            html.push(util.tag("button",{onclick:"cluster.showTemplate(\""+key+"\")"}));
            html.push(key+"</button>");
        }
        $("#cluster-templates").html(html.join(''));
        $("#cluster-set-local").html("set local : "+clusterData.isLocal);
        $("#cluster-set-naming").html("short host names : "+clusterData.shortenHost);
        $.ajax({
            url:"/render/hint",
            data:{cluster:clusterNode.id},
            success:function(data,status,xhr) {
                $('#cluster-hint').html(data);
            },
            error:function(xhr,status,error) {
                alert("Failure Hinting Cluster: "+error);
            }
        });
    },

    update:function() {
        $.ajax({
            url:"/api/update_cluster",
            data:{account:db.account,cluster:clusterNode.id,data:JSON.stringify(clusterData)},
            success:function(data,status,xhr) {
                console.log('cluster updated');
                cluster.select(clusterNode);
            },
            error:function(xhr,status,error) {
                alert("Failure Updating Cluster: "+error);
            }
        });
    },

    manage:function() {

    },

    setAbout:function() {
        clusterData.about = prompt("Describe this cluster",clusterData.about || clusterNode.id);
        cluster.update();
    },

    setLocal:function() {
        var local = prompt("Is this a local stack?", clusterData.isLocal);
        clusterData.isLocal = (local == 'true' || local == '1');
        cluster.update();
    },

    setShortHost:function() {
        var shorten = prompt("Shorten node host names?", clusterData.shortenHost);
        clusterData.shortenHost = (shorten == 'true' || shorten == '1');
        cluster.update();
    },

    setRequired:function(require) {

    },

    showRegistered:function(registered) {

    },

    showTemplate:function(template){

    },

    add:function() {
        $.ajax({
            url:"/api/create_cluster",
            data:{account:db.account},
            success:function(data,status,xhr) {
                clusterSelect = decode(data).cluster;
                account.get();
            },
            error:function(xhr,status,error) {
                alert("Failure Creating Cluster: "+error);
            }
        });
    },

    delete:function() {
        if (clusterNode == null) return alert("no cluster selected");
        if (prompt("Are you sure you want to delete this cluster? Type 'YES' to confirm", "NO, my bad") != "YES") return;
        $.ajax({
            url:"/api/delete_cluster",
            data:{account:db.account,cluster:clusterNode.id},
            success:function(data,status,xhr) {
                account.get();
            },
            error:function(xhr,status,error) {
                alert("Failure Deleting Cluster: "+error);
            }
        });
    }
};