<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ChangeFcmTokensToPolymorphic extends Migration
{
    public function up()
    {
        Schema::table('fcm_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('fcm_tokens', 'id_user')) {
                $table->dropColumn('id_user');
            }
            if (Schema::hasColumn('fcm_tokens', 'id_pegawai')) {
                $table->dropColumn('id_pegawai');
            }

            $table->unsignedBigInteger('owner_id');
            $table->string('owner_type');

            $table->index(['owner_type', 'owner_id'], 'fcm_tokens_owner_index');
        });
    }

    public function down()
    {
        Schema::table('fcm_tokens', function (Blueprint $table) {
            $table->dropIndex('fcm_tokens_owner_index');
            $table->dropColumn(['owner_type', 'owner_id']);

            $table->unsignedBigInteger('id_user')->nullable();
            $table->foreign('id_user')
                  ->references('id_user')
                  ->on('users')
                  ->onDelete('cascade');

            // $table->unsignedBigInteger('id_pegawai')->nullable();
            // $table->foreign('id_pegawai')
            //       ->references('id_pegawai')
            //       ->on('pegawai')
            //       ->onDelete('cascade');
        });
    }
}
