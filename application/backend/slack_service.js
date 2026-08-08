/**
 * Slack Notification Service
 *
 * Sends deployment notifications to Slack channel
 */
class SlackService {
  constructor(botToken, channelId) {
    if (!botToken) {
      throw new Error('Slack bot token is required for SlackService');
    }
    if (!channelId) {
      throw new Error('Slack channel ID is required for SlackService');
    }

    this.botToken = botToken;
    this.channelId = channelId;
    this.slackApiUrl = 'https://slack.com/api/chat.postMessage';
  }

  /**
   * Send a message to Slack using blocks format
   * @private
   */
  async sendMessage(blocks, fallbackText) {
    try {
      const response = await fetch(this.slackApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          channel: this.channelId,
          text: fallbackText,
          blocks: blocks
        })
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data);
        throw new Error(`Slack API error: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }

  /**
   * Send deployment start notification
   * @param {Object} deploymentInfo - Deployment information
   * @param {string} deploymentInfo.deploymentId - Deployment ID
   * @param {string} deploymentInfo.repository - Target repository URL
   * @param {string} deploymentInfo.branch - Target branch
   * @param {string} deploymentInfo.triggeredBy - Who triggered the deployment
   */
  async sendDeploymentStart(deploymentInfo) {
    const { deploymentId, repository, branch = 'main', triggeredBy = 'System' } = deploymentInfo;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🥚✨ 야생의 포켓몬 알이 나타났다! / 野生のポケモンのタマゴが現れた!",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```\n🥚 신비로운 포켓몬 알이 발견되었습니다!\n🥚 不思議なポケモンのタマゴが見つかりました!\n\n알에서 무엇이 나올지 기대되네요...\nタマゴから何が出てくるか楽しみですね...\n\n💫 곧 멋진 포켓몬이 부화할 예정입니다!\n💫 素敵なポケモンが孵化する予定です!\n```"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*배포 ID / デプロイID:*\n\`${deploymentId}\``
          },
          {
            type: "mrkdwn",
            text: `*저장소 / リポジトリ:*\n${repository}`
          },
          {
            type: "mrkdwn",
            text: `*브랜치 / ブランチ:*\n\`${branch}\``
          },
          {
            type: "mrkdwn",
            text: `*트리거 / トリガー:*\n${triggeredBy}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `⏰ 시작 시각 / 開始時刻: <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`
          }
        ]
      }
    ];

    return this.sendMessage(blocks, `🥚 포켓몬 알 발견! / ポケモンのタマゴ発見!: ${deploymentId}`);
  }

  /**
   * Send deployment progress update
   * @param {Object} progressInfo - Progress information
   * @param {string} progressInfo.deploymentId - Deployment ID
   * @param {string} progressInfo.step - Current step name
   * @param {string} progressInfo.status - Step status
   */
  async sendDeploymentProgress(progressInfo) {
    const { deploymentId, step, status } = progressInfo;

    const statusEmoji = {
      'in_progress': '⏳',
      'completed': '✅',
      'queued': '🕐',
      'success': '✅',
      'failure': '❌'
    };

    const emoji = statusEmoji[status] || '📋';

    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *배포 진행 중* - \`${deploymentId}\``
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*현재 단계:* ${step}\n*상태:* ${status}`
        }
      }
    ];

    return this.sendMessage(blocks, `${emoji} 배포 진행: ${step}`);
  }

  /**
   * Send deployment success notification
   * @param {Object} deploymentInfo - Deployment information
   * @param {string} deploymentInfo.deploymentId - Deployment ID
   * @param {string} deploymentInfo.repository - Target repository URL
   * @param {string} deploymentInfo.serviceUrl - Deployed service URL
   * @param {string} deploymentInfo.runUrl - GitHub Actions run URL
   * @param {number} deploymentInfo.duration - Deployment duration in seconds
   */
  async sendDeploymentSuccess(deploymentInfo) {
    const { deploymentId, repository, serviceUrl, runUrl, duration, metrics } = deploymentInfo;
    const durationMinutes = Math.floor(duration / 60);
    const durationSeconds = duration % 60;

    // Calculate stats based on deployment metrics
    const calculateStars = (value, max) => {
      const rating = Math.min(5, Math.max(1, Math.ceil((value / max) * 5)));
      return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    // Default metrics if not provided
    const avgCpu = metrics?.cpu || 5.0;
    const avgMem = metrics?.memory || 50.0;
    const avgDuration = duration || 60;
    const hasErrors = metrics?.errors || false;

    // Calculate stats (inverted for cpu/memory - lower is better)
    const attackStars = calculateStars(Math.max(0, 100 - avgDuration), 100); // Speed
    const defenseStars = calculateStars(Math.max(0, 100 - avgMem), 100); // Memory efficiency
    const speedStars = calculateStars(Math.max(0, 100 - avgCpu), 100); // CPU efficiency
    const reliabilityStars = hasErrors ? '★★★☆☆' : '★★★★★'; // Reliability

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🐉💫 메가진화! 메가망나뇽이 되었다! / メガシンカ! メガカイリューになった!",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```\n🥚➡️🐲➡️🐉✨\n\n축하합니다! 망나뇽이 메가망나뇽으로 진화했습니다!\nおめでとうございます! カイリューがメガカイリューに進化しました!\n\n압도적인 파워와 스피드를 자랑하는 메가망나뇽!\n圧倒的なパワーとスピードを誇るメガカイリュー!\n\n이제 어떤 도전도 두렵지 않습니다! 🚀\nもうどんな挑戦も怖くありません! 🚀\n```"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*배포 ID / デプロイID:*\n\`${deploymentId}\``
          },
          {
            type: "mrkdwn",
            text: `*저장소 / リポジトリ:*\n${repository}`
          },
          {
            type: "mrkdwn",
            text: `*진화 시간 / 進化時間:*\n약 ${durationMinutes}분 ${durationSeconds}초`
          },
          {
            type: "mrkdwn",
            text: `*서비스 URL / サービスURL:*\n<${serviceUrl}|접속하기 🔗>`
          }
        ]
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🎊 *메가망나뇽 스탯 / メガカイリューのステータス:*\n\`\`\`\n공격력(Attack): ${attackStars}\n防御力(Defense): ${defenseStars}\n속도(Speed):   ${speedStars}\n신뢰성(Reliability): ${reliabilityStars}\n\`\`\`\n\n✨ 트레이너 여러분, 훌륭한 배포였습니다!\n✨ トレーナーの皆さん、素晴らしいデプロイでした!`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `⏰ 진화 완료 시각 / 進化完了時刻: <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔍 진화 과정 보기 / 進化過程"
            },
            url: runUrl,
            style: "primary"
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🌐 메가망나뇽 만나기"
            },
            url: serviceUrl
          }
        ]
      }
    ];

    return this.sendMessage(blocks, `🐉 메가진화 완료! / メガシンカ完了!: ${deploymentId}`);
  }

  /**
   * Send deployment failure notification
   * @param {Object} deploymentInfo - Deployment information
   * @param {string} deploymentInfo.deploymentId - Deployment ID
   * @param {string} deploymentInfo.repository - Target repository URL
   * @param {string} deploymentInfo.error - Error message
   * @param {string} deploymentInfo.runUrl - GitHub Actions run URL
   * @param {number} deploymentInfo.duration - Deployment duration in seconds
   */
  async sendDeploymentFailure(deploymentInfo) {
    const { deploymentId, repository, error, runUrl, duration } = deploymentInfo;
    const durationMinutes = Math.floor(duration / 60);
    const durationSeconds = duration % 60;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "😅 배포 실패... 하지만 괜찮아요!",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```\n⚠️ 배포 중 문제가 발생했습니다.\n하지만 걱정하지 마세요! 에러는 배움의 기회입니다.\n로그를 확인하고 다시 도전해봐요! 🚀\n```"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*배포 ID:*\n\`${deploymentId}\``
          },
          {
            type: "mrkdwn",
            text: `*저장소:*\n${repository}`
          },
          {
            type: "mrkdwn",
            text: `*소요 시간:*\n약 ${durationMinutes}분 ${durationSeconds}초`
          },
          {
            type: "mrkdwn",
            text: "*상태:*\n❌ 실패"
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*오류 메시지:*\n\`\`\`${error}\`\`\``
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "💡 *다음 단계:*\n1. 에러 로그를 확인하세요\n2. 수정 후 다시 배포하면 됩니다\n3. 막히면 팀원들에게 도움을 요청하세요!\n\n_실패는 성공의 어머니입니다._ 😊"
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `⏰ 실패 시각: <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "🔥 에러 로그 확인"
            },
            url: runUrl,
            style: "danger"
          }
        ]
      }
    ];

    return this.sendMessage(blocks, `❌ 배포 실패: ${deploymentId}`);
  }
}

module.exports = SlackService;
