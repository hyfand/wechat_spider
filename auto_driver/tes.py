import datetime, time

test_time = ['2018-07-01 0:00:00', '2018-07-01 8:00:00', '2018-07-01 23:59:59']


def tostamp(test_time):
    for t in test_time:
        stime = int((time.mktime(
            (datetime.datetime.strptime(t, "%Y-%m-%d %H:%M:%S")).timetuple()) + 28800) / 86400)
        print('%s —> %s' % (t, stime))

tostamp(test_time)